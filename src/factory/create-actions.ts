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
} from '../types';
import {
  commonRequestStartAction,
  commonRequestSuccessAction,
  commonRequestErrorAction,
  commonRequestCancelAction,
} from '../actions';
import {
  actionToString,
  getRequestKey,
  getSerializedKey,
  memoizeDebounce,
  isNeedLoadData,
} from './helpers';

const createActions = <Response, Error, Params, State>(
  config: PreparedConfig,
  factoryConfig: RequestFactoryConfig<Response, Params>
): RequestsFactoryItemActions<Response, Error, Params> => {
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

  const createAsyncAction = <Action = any>(
    type: string,
    getAction: (config: GetActionConfig<Params>) => any
  ) => {
    const asyncAction = (params?: Params): Action => {
      const meta: RequestActionMeta = {
        key: stateRequestKey,
        serializedKey: getSerializedKey<Response, Params>(
          factoryConfig,
          params
        ),
      };
      const requestKey = getRequestKey(meta);

      const action = getAction({
        params,
        meta,
        requestKey,
      });

      action.type = type;
      action.meta = meta;
      action.payload = params;

      action.toString = actionToString;

      return action as Action;
    };

    asyncAction.type = type;
    asyncAction.toString = () => type;

    return asyncAction;
  };

  const requestFulfilledAction = createSyncAction<
    { params?: Params; response: Response },
    RequestFulfilledAction<Response, Params>
  >(`${FactoryActionTypes.RequestFulfilled}/${stateRequestKey}`);

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
      getDoRequestAction()
    ),
    forcedLoadDataAction: createAsyncAction<ForcedLoadDataAction<Params>>(
      `${FactoryActionTypes.ForcedLoadData}/${stateRequestKey}`,
      getDoRequestAction()
    ),
    loadDataAction: createAsyncAction<LoadDataAction<Params>>(
      `${FactoryActionTypes.LoadData}/${stateRequestKey}`,
      getDoRequestAction(false)
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
      }
    ),
    requestFulfilledAction,
  };
};

export default createActions;
