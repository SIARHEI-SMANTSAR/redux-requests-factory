import { Dispatch } from 'redux';

import {
  RequestsFactoryItemActions,
  PreparedConfig,
  RequestFactoryConfig,
  RequestActionMeta,
  FactoryActionTypes,
  DoRequestAction,
  CancelRequestAction,
  GetActionConfig,
  ForcedLoadDataAction,
  LoadDataAction,
  RequestFulfilledAction,
  RequestRejectedAction,
  SetErrorAction,
  SetResponseAction,
  ResetRequestAction,
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

  const createAsyncAction = <Action = any, Data = Params | undefined>(
    type: string,
    getAction: (config: GetActionConfig<Params, Data>) => any,
    getPramsFromData: (data: Data) => Params | undefined
  ) => {
    const asyncAction = (data: Data): Action => {
      const params: Params | undefined = getPramsFromData(data);
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

      return action as Action;
    };

    asyncAction.type = type;
    asyncAction.toString = () => type;

    return asyncAction;
  };

  const requestFulfilledAction = createSyncAction<
    { params?: Params; response: Resp },
    RequestFulfilledAction<Resp, Params>
  >(`${FactoryActionTypes.RequestFulfilled}/${stateRequestKey}`);

  const requestRejectedAction = createSyncAction<
    { params?: Params; error: Err },
    RequestRejectedAction<Err, Params>
  >(`${FactoryActionTypes.RequestRejected}/${stateRequestKey}`);

  const doRequest = async ({
    params,
    dispatch,
    meta,
    requestKey,
  }: {
    params?: Params;
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
  }: GetActionConfig<Params>) => async (
    dispatch: Dispatch,
    getState: () => State
  ) => {
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
    doRequestAction: createAsyncAction<DoRequestAction<Params>>(
      `${FactoryActionTypes.DoRequest}/${stateRequestKey}`,
      getDoRequestAction(),
      identity
    ),
    forcedLoadDataAction: createAsyncAction<ForcedLoadDataAction<Params>>(
      `${FactoryActionTypes.ForcedLoadData}/${stateRequestKey}`,
      getDoRequestAction(),
      identity
    ),
    loadDataAction: createAsyncAction<LoadDataAction<Params>>(
      `${FactoryActionTypes.LoadData}/${stateRequestKey}`,
      getDoRequestAction(false),
      identity
    ),
    cancelRequestAction: createAsyncAction<CancelRequestAction<Params>>(
      `${FactoryActionTypes.CancelRequest}/${stateRequestKey}`,
      ({ meta, requestKey }: GetActionConfig<Params>) => {
        if (doRequestMapByKey[requestKey]) {
          cancelMapByKey[requestKey] = true;
        }

        return async (dispatch: Dispatch) => {
          if (doRequestMapByKey[requestKey]) {
            dispatch(commonRequestCancelAction(meta));
          }
        };
      },
      identity
    ),
    setErrorAction: createAsyncAction<
      SetErrorAction<Err, Params>,
      { error: Err; params?: Params }
    >(
      `${FactoryActionTypes.SetError}/${stateRequestKey}`,
      ({
        meta,
        data: { error },
        params,
      }: GetActionConfig<Params, { error: Err; params?: Params }>) => {
        return async (dispatch: Dispatch) => {
          dispatch(commonRequestErrorAction(meta, error));
          dispatch(requestRejectedAction({ params, error }, meta));
        };
      },
      ({ params }) => params
    ),
    setResponseAction: createAsyncAction<
      SetResponseAction<Resp, Params>,
      { response: Resp; params?: Params }
    >(
      `${FactoryActionTypes.SetResponse}/${stateRequestKey}`,
      ({
        meta,
        data: { response },
        params,
      }: GetActionConfig<Params, { response: Resp; params?: Params }>) => {
        return async (dispatch: Dispatch) => {
          dispatch(commonRequestSuccessAction(meta, response));
          dispatch(requestFulfilledAction({ params, response }, meta));
        };
      },
      ({ params }) => params
    ),
    resetRequestAction: createAsyncAction<ResetRequestAction<Params>>(
      `${FactoryActionTypes.ResetRequest}/${stateRequestKey}`,
      ({ meta }: GetActionConfig<Params>) => {
        return async (dispatch: Dispatch) => {
          dispatch(commonRequestResetAction(meta));
        };
      },
      identity
    ),
    requestFulfilledAction,
    requestRejectedAction,
  };
};

export default createActions;
