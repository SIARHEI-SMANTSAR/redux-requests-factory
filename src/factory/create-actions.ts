import { Dispatch } from 'redux';

import {
  PreparedConfig,
  RequestFactoryConfig,
  RequestActionMeta,
  FactoryActionTypes,
  RequestsFactoryItemActions,
  ActionPropsFromMiddleware,
} from '../types';
import {
  commonRequestStartAction,
  commonRequestSuccessAction,
  commonRequestErrorAction,
  commonRequestCancelAction,
  commonRequestResetAction,
} from '../actions';
import {
  actionToString,
  getRequestKey,
  getSerializedKey,
  memoizeDebounce,
  isNeedLoadData,
  identity,
} from './helpers';

const createActions = <Resp, Err, Params, State, Key extends string>(
  config: PreparedConfig<Key>,
  factoryConfig: RequestFactoryConfig<Resp, Params>
): RequestsFactoryItemActions<Resp, Err, Params> => {
  const {
    request,
    stateRequestKey,
    useDebounce = false,
    debounceWait = 500,
    debounceOptions,
    stringifyParamsForDebounce = JSON.stringify,
  } = factoryConfig;

  const cancelMapByKey: { [key: string]: boolean } = {};
  const doRequestMapByKey: { [key: string]: boolean } = {};

  const createSyncAction = <
    Data,
    Action extends { type: string; meta: RequestActionMeta; payload: Data }
  >(
    type: string
  ) => {
    const syncAction = (data: Data, meta: RequestActionMeta): Action => {
      return { type, meta, payload: data } as Action;
    };

    syncAction.type = type;
    syncAction.toString = () => type;

    return syncAction;
  };

  const createAsyncAction = <Data = Params>(
    type: string,
    getAction: (config: {
      params: Params;
      meta: RequestActionMeta;
      requestKey: string;
      data: Data;
    }) => {
      (props: ActionPropsFromMiddleware<State>): void;
      type?: string;
      meta?: RequestActionMeta;
      payload?: Data;
    },
    getPramsFromData: (data: Data) => Params
  ) => {
    const asyncAction = (data: Data) => {
      const params: Params = getPramsFromData(data);
      const meta: RequestActionMeta = {
        key: stateRequestKey,
        serializedKey: getSerializedKey<Resp, Params>(factoryConfig, params),
      };
      const requestKey = getRequestKey(meta);

      const action = getAction({
        params,
        meta,
        requestKey,
        data,
      });

      action.type = type;
      action.meta = meta;
      action.payload = data;

      action.toString = actionToString;

      return action;
    };

    asyncAction.type = type;
    asyncAction.toString = () => type;

    return asyncAction;
  };

  const requestFulfilledAction = createSyncAction(
    `${FactoryActionTypes.RequestFulfilled}/${stateRequestKey}`
  );

  const requestRejectedAction = createSyncAction(
    `${FactoryActionTypes.RequestRejected}/${stateRequestKey}`
  );

  const doRequest = async ({
    params,
    dispatch,
    meta,
    requestKey,
  }: {
    params: Params;
    dispatch: Dispatch;
    meta: RequestActionMeta;
    requestKey: string;
  }) => {
    cancelMapByKey[requestKey] = false;
    doRequestMapByKey[requestKey] = true;

    dispatch(commonRequestStartAction(meta));
    try {
      const response = await request(params);
      if (!cancelMapByKey[requestKey]) {
        dispatch(commonRequestSuccessAction(meta, response));
        dispatch(requestFulfilledAction({ params, response }, meta));
      }
    } catch (error) {
      if (!cancelMapByKey[requestKey]) {
        dispatch(commonRequestErrorAction(meta, error));
        dispatch(requestRejectedAction({ params, error }, meta));
      }
    } finally {
      doRequestMapByKey[requestKey] = false;
    }
  };

  const memoizedDoRequest = memoizeDebounce(doRequest, debounceWait, {
    leading: true,
    trailing: false,
    maxWait: debounceWait,
    ...debounceOptions,
    resolver: ({ params }: { params?: Params }) => {
      try {
        return stringifyParamsForDebounce(params);
      } catch (error) {
        return params;
      }
    },
  });

  const getDoRequestAction = (isForced: boolean = true) => ({
    params,
    meta,
    requestKey,
  }: {
    params: Params;
    requestKey: string;
    meta: RequestActionMeta;
  }) => async ({ dispatch, getState }: ActionPropsFromMiddleware<State>) => {
    if (isForced || isNeedLoadData(config, meta, getState())) {
      return await (useDebounce ? memoizedDoRequest : doRequest)({
        params,
        dispatch,
        meta,
        requestKey,
      });
    }
  };

  return {
    doRequestAction: createAsyncAction(
      `${FactoryActionTypes.DoRequest}/${stateRequestKey}`,
      getDoRequestAction(),
      identity
    ),
    forcedLoadDataAction: createAsyncAction(
      `${FactoryActionTypes.ForcedLoadData}/${stateRequestKey}`,
      getDoRequestAction(),
      identity
    ),
    loadDataAction: createAsyncAction(
      `${FactoryActionTypes.LoadData}/${stateRequestKey}`,
      getDoRequestAction(false),
      identity
    ),
    cancelRequestAction: createAsyncAction(
      `${FactoryActionTypes.CancelRequest}/${stateRequestKey}`,
      ({ meta, requestKey }) => {
        if (doRequestMapByKey[requestKey]) {
          cancelMapByKey[requestKey] = true;
        }

        return async ({ dispatch }: ActionPropsFromMiddleware<State>) => {
          if (doRequestMapByKey[requestKey]) {
            dispatch(commonRequestCancelAction(meta));
          }
        };
      },
      identity
    ),
    setErrorAction: createAsyncAction(
      `${FactoryActionTypes.SetError}/${stateRequestKey}`,
      ({ meta, data: { error }, params }) => {
        return async ({ dispatch }: ActionPropsFromMiddleware<State>) => {
          dispatch(commonRequestErrorAction(meta, error));
          dispatch(requestRejectedAction({ params, error }, meta));
        };
      },
      ({ params }) => params
    ),
    setResponseAction: createAsyncAction(
      `${FactoryActionTypes.SetResponse}/${stateRequestKey}`,
      ({ meta, data: { response }, params }) => {
        return async ({ dispatch }: ActionPropsFromMiddleware<State>) => {
          dispatch(commonRequestSuccessAction(meta, response));
          dispatch(requestFulfilledAction({ params, response }, meta));
        };
      },
      ({ params }) => params
    ),
    resetRequestAction: createAsyncAction(
      `${FactoryActionTypes.ResetRequest}/${stateRequestKey}`,
      ({ meta }) => {
        return async ({ dispatch }: ActionPropsFromMiddleware<State>) => {
          dispatch(commonRequestResetAction(meta));
        };
      },
      identity
    ),
    requestFulfilledAction,
    requestRejectedAction,
  } as RequestsFactoryItemActions<Resp, Err, Params>;
};

export default createActions;
