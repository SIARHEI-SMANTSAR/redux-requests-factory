import { Dispatch } from 'redux';

import {
  PreparedConfig,
  RequestFactoryConfig,
  RequestActionMeta,
  FactoryActionTypes,
  RequestsFactoryItemActions,
  ActionPropsFromMiddleware,
  ExternalActions,
  DoRequestMapByKey,
  ActionOptions,
} from '../types';
import {
  commonRequestStartAction,
  commonRequestSuccessAction,
  commonRequestErrorAction,
  commonRequestCancelAction,
  commonRequestResetAction,
  globalLoadingIncrementAction,
  globalLoadingDecrementAction,
} from '../actions';
import {
  actionToString,
  getRequestKey,
  getSerializedKey,
  memoizeDebounce,
  isNeedLoadData,
  identity,
  setNewRequestToMap,
  isRequestCanceled,
  deleteRequestFromMap,
  cancelRequestInMap,
  actionToObject,
  getResponse,
  isRequestFulfilled,
} from './helpers';

const createActions = <
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
  Key extends string
>(
  config: PreparedConfig<Key>,
  factoryConfig: RequestFactoryConfig<Resp, Err, Params, State, TransformedResp>
): RequestsFactoryItemActions<Resp, Err, Params> => {
  const {
    request,
    stateRequestKey,
    useDebounce = false,
    debounceWait = 500,
    debounceOptions,
    stringifyParamsForDebounce = JSON.stringify,
    fulfilledActions = [],
    rejectedActions = [],
    includeInGlobalLoading = true,
    transformError = identity,
    dispatchFulfilledActionForLoadedRequest = false,
    globalLoadingTimeout,
  } = factoryConfig;

  let isRequestFulfilledActionNeeded = false;
  let isRequestRejectedActionNeeded = false;

  let lastRequestNumber = 0;

  let globalLoadingTimeoutId: ReturnType<typeof setTimeout>;
  let globalLoadingDecrementedAfterTimeout = false;

  const doRequestMapByKey: DoRequestMapByKey = new Map();

  const getDispatchExternalActions = <Data>(
    externalActions: ExternalActions<Data>
  ) => (dispatch: Dispatch, data: Data) => {
    externalActions.forEach(externalAction => {
      const action =
        typeof externalAction === 'function'
          ? externalAction(data)
          : externalAction;

      if (Array.isArray(action)) {
        action.forEach(a => {
          if (a !== null) {
            dispatch(a);
          }
        });
      } else if (action !== null) {
        dispatch(action);
      }
    });
  };

  const dispatchFulfilledActions = getDispatchExternalActions(fulfilledActions);

  const dispatchRejectedActions = getDispatchExternalActions(rejectedActions);

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
    syncAction.getType = () => type;

    return syncAction;
  };

  const createAsyncAction = <Data = Params>(
    type: string,
    getAction: (config: {
      params: Params;
      meta: RequestActionMeta;
      requestKey: string;
      data: Data;
      silent: boolean;
    }) => {
      (props: ActionPropsFromMiddleware<State>): void;
      type?: string;
      meta?: RequestActionMeta;
      payload?: Data;
      toString?(): string;
      toJSON?(): string;
      toObject?(): any;
    },
    getParamsFromData: (data: Data) => Params
  ) => {
    const asyncAction = (
      data: Data,
      options?: ActionOptions
    ): {
      type: string;
      meta: RequestActionMeta;
      payload?: Data;
      toString(): string;
      toJSON(): string;
      toObject(): any;
    } => {
      const params: Params = getParamsFromData(data);
      const meta: RequestActionMeta = {
        key: stateRequestKey,
        serializedKey: getSerializedKey<
          Resp,
          Err,
          Params,
          State,
          TransformedResp
        >(factoryConfig, params),
      };
      const requestKey = getRequestKey(meta);
      const silent = options?.silent || false;

      const action = getAction({
        params,
        meta,
        requestKey,
        data,
        silent,
      });

      action.type = type;
      action.meta = meta;
      action.payload = data;

      action.toString = actionToString;
      action.toJSON = actionToString;
      action.toObject = actionToObject;

      return action as {
        type: string;
        meta: RequestActionMeta;
        payload?: Data;
        toString(): string;
        toJSON(): string;
        toObject(): any;
      };
    };

    asyncAction.type = type;
    asyncAction.toString = () => type;
    asyncAction.getType = () => type;

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
    getState,
    silent,
  }: {
    params: Params;
    dispatch: Dispatch;
    meta: RequestActionMeta;
    requestKey: string;
    getState: () => State;
    silent: boolean;
  }) => {
    const requestNumber = ++lastRequestNumber;

    setNewRequestToMap(doRequestMapByKey, requestKey, requestNumber);

    dispatch(commonRequestStartAction(meta));

    if (includeInGlobalLoading && !silent) {
      dispatch(globalLoadingIncrementAction());
    }

    if (globalLoadingTimeout) {
      globalLoadingTimeoutId = setTimeout(() => {
        if (!isRequestCanceled(doRequestMapByKey, requestKey, requestNumber)) {
          if (includeInGlobalLoading && !silent) {
            globalLoadingDecrementedAfterTimeout = true;

            dispatch(globalLoadingDecrementAction());
          }
        }
      }, globalLoadingTimeout);
    }

    try {
      const response = await request(params);

      clearTimeout(globalLoadingTimeoutId);

      if (!isRequestCanceled(doRequestMapByKey, requestKey, requestNumber)) {
        dispatch(commonRequestSuccessAction(meta, response));
        if (isRequestFulfilledActionNeeded) {
          dispatch(requestFulfilledAction({ params, response }, meta));
        }
        dispatchFulfilledActions(dispatch, {
          request: params,
          response, // TODO use transform response
          state: getState(),
        });
      }
    } catch (error) {
      if (!isRequestCanceled(doRequestMapByKey, requestKey, requestNumber)) {
        dispatch(commonRequestErrorAction(meta, error));
        const transformedError = transformError<Err>(error);
        if (isRequestRejectedActionNeeded) {
          dispatch(
            requestRejectedAction(
              {
                params,
                error: transformedError,
              },
              meta
            )
          );
        }
        dispatchRejectedActions(dispatch, {
          request: params,
          error: transformedError,
          state: getState(),
        });
      }
    } finally {
      if (
        includeInGlobalLoading &&
        !silent &&
        !isRequestCanceled(doRequestMapByKey, requestKey, requestNumber) &&
        !globalLoadingDecrementedAfterTimeout
      ) {
        dispatch(globalLoadingDecrementAction());
      }

      deleteRequestFromMap(doRequestMapByKey, requestKey, requestNumber);
    }
  };

  const getMemoizedDoRequest = () =>
    memoizeDebounce(doRequest, debounceWait, {
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

  let memoizedDoRequest = getMemoizedDoRequest();

  const getDoRequestAction = (isForced: boolean = true) => ({
    params,
    meta,
    requestKey,
    silent,
  }: {
    params: Params;
    requestKey: string;
    meta: RequestActionMeta;
    silent: boolean;
  }) => async ({ dispatch, getState }: ActionPropsFromMiddleware<State>) => {
    if (isForced || isNeedLoadData(config, meta, getState())) {
      return await (useDebounce ? memoizedDoRequest : doRequest)({
        params,
        dispatch,
        meta,
        requestKey,
        getState,
        silent,
      });
    } else if (
      dispatchFulfilledActionForLoadedRequest &&
      isRequestFulfilledActionNeeded &&
      isRequestFulfilled(config, meta, getState())
    ) {
      const response = getResponse(config, meta, getState());

      dispatch(requestFulfilledAction({ params, response }, meta));
      dispatchFulfilledActions(dispatch, {
        request: params,
        response, // TODO use transform response
        state: getState(),
      });
    }
  };

  return new Proxy(
    {
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
        ({ meta, requestKey, silent }) => {
          return ({ dispatch }: ActionPropsFromMiddleware<State>) => {
            if (cancelRequestInMap(doRequestMapByKey, requestKey)) {
              dispatch(commonRequestCancelAction(meta));

              clearTimeout(globalLoadingTimeoutId);

              if (
                includeInGlobalLoading &&
                !silent &&
                !globalLoadingDecrementedAfterTimeout
              ) {
                dispatch(globalLoadingDecrementAction());
              }

              if (useDebounce) {
                memoizedDoRequest = getMemoizedDoRequest();
              }
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
            if (isRequestRejectedActionNeeded) {
              dispatch(requestRejectedAction({ params, error }, meta));
            }
          };
        },
        ({ params }) => params as Params
      ),
      setResponseAction: createAsyncAction(
        `${FactoryActionTypes.SetResponse}/${stateRequestKey}`,
        ({ meta, data: { response }, params }) => {
          return async ({ dispatch }: ActionPropsFromMiddleware<State>) => {
            dispatch(commonRequestSuccessAction(meta, response));
            if (isRequestFulfilledActionNeeded) {
              dispatch(requestFulfilledAction({ params, response }, meta));
            }
          };
        },
        ({ params }) => params as Params
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
    } as RequestsFactoryItemActions<Resp, Err, Params>,
    {
      get(target: any, prop: any) {
        if (prop === 'requestFulfilledAction') {
          isRequestFulfilledActionNeeded = true;
        }
        if (prop === 'requestRejectedAction') {
          isRequestRejectedActionNeeded = true;
        }
        return target[prop];
      },
    }
  );
};

export default createActions;
