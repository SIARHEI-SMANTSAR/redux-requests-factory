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
  Actions,
  LoadDataRetryStatus,
  RequestsStatuses,
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
import { DEFAULT_STATE_REQUESTS_KEY } from '../constants';
import {
  actionToString,
  getRequestKey,
  getSerializedKey,
  memoizeDebounce,
  isNeedLoadData,
  identity,
  setNewRequestToMap,
  deleteRequestFromMap,
  cancelRequestInMap,
  actionToObject,
  getResponse,
  isRequestFulfilled,
} from './helpers';

const defaultLoadDataRetryStatuses: readonly LoadDataRetryStatus[] = [
  RequestsStatuses.Failed,
  RequestsStatuses.Canceled,
];

const createActions = <
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
  Key extends string,
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
    includeInGlobalLoading,
    staleTime = Infinity,
    loadDataRetryStatuses,
    loadDataHydratedRetryStatuses,
    transformError = identity,
    retry,
    dispatchFulfilledActionForLoadedRequest = false,
    globalLoadingTimeout,
  } = factoryConfig;

  let isRequestFulfilledActionNeeded = false;
  let isRequestRejectedActionNeeded = false;

  const dispatchStateAction = (dispatch: Dispatch, action: Actions) =>
    dispatch({ ...action, stateRequestsKey: config.stateRequestsKey });

  const getDispatchExternalActions =
    <Data>(externalActions: ExternalActions<Data>) =>
    (dispatch: Dispatch, data: Data) => {
      externalActions.forEach((externalAction) => {
        const action =
          typeof externalAction === 'function'
            ? externalAction(data)
            : externalAction;

        if (Array.isArray(action)) {
          action.forEach((a) => {
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
    Action extends { type: string; meta: RequestActionMeta; payload: Data },
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
      forwardFactoryAction?: boolean;
      stateRequestsKey?: string;
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
      forwardFactoryAction?: boolean;
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
      action.forwardFactoryAction = options?.forwardFactoryAction;
      action.stateRequestsKey = config.stateRequestsKey;

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
        forwardFactoryAction?: boolean;
      };
    };

    asyncAction.type = type;
    asyncAction.toString = () => type;
    asyncAction.getType = () => type;

    return asyncAction;
  };

  // The separate delimiter keeps custom types distinct from arbitrary default keys.
  const lifecycleActionSuffix =
    config.stateRequestsKey === DEFAULT_STATE_REQUESTS_KEY
      ? `/${stateRequestKey}`
      : `:${JSON.stringify([config.stateRequestsKey, stateRequestKey])}`;

  const requestFulfilledAction = createSyncAction(
    `${FactoryActionTypes.RequestFulfilled}${lifecycleActionSuffix}`
  );

  const requestRejectedAction = createSyncAction(
    `${FactoryActionTypes.RequestRejected}${lifecycleActionSuffix}`
  );

  type RequestMode = 'load' | 'reload' | 'direct';

  type DoRequestArgs = {
    params: Params;
    dispatch: Dispatch;
    meta: RequestActionMeta;
    requestKey: string;
    getState: () => State;
    silent: boolean;
    mode: RequestMode;
    includeInGlobalLoading: boolean;
    runtime: RequestRuntimeState;
    registerRequestCancellation: (cancel: () => void) => () => void;
    execution: {
      canceled: boolean;
      started: boolean;
    };
  };

  type DoRequest = (args: DoRequestArgs) => Promise<void>;

  type LoadPromiseState = {
    status: 'pending' | 'fulfilled' | 'rejected';
    promise: Promise<void>;
  };

  type RequestRuntimeState = {
    doRequestMapByKey: DoRequestMapByKey;
    // The hydration generation for which this middleware runtime most recently
    // started work. A missing entry differs from initial generation 0, allowing
    // one retry for terminal state supplied through initial preloaded state.
    loadAttemptHydrationVersionByKey: Map<string, number>;
    lastRequestNumber: number;
    completedRequestNumberByKey: Map<string, number>;
    // React use() requires the same thenable when a suspended component is
    // retried. Keep the latest Promise after settlement as well as in flight;
    // a real reload replaces the complete entry with a new Promise.
    loadPromiseStateMapByKey: Map<string, LoadPromiseState>;
    memoizedDoRequest: DoRequest;
  };

  const doRequest: DoRequest = ({
    params,
    dispatch,
    meta,
    requestKey,
    getState,
    silent,
    mode,
    includeInGlobalLoading,
    runtime,
    registerRequestCancellation,
    execution,
  }) => {
    if (execution.canceled) {
      return Promise.resolve();
    }

    execution.started = true;
    const requestNumber = ++runtime.lastRequestNumber;
    const abortController =
      typeof AbortController === 'undefined'
        ? undefined
        : new AbortController();

    let resolveCancellation!: () => void;
    const cancellationPromise = new Promise<void>((resolve) => {
      resolveCancellation = resolve;
    });

    const activeRequest = setNewRequestToMap(
      runtime.doRequestMapByKey,
      requestKey,
      requestNumber,
      abortController,
      resolveCancellation
    );

    const completedRequestNumber = () =>
      runtime.completedRequestNumberByKey.get(requestKey) ?? 0;
    const canPublishResult = () =>
      mode === 'direct' || requestNumber >= completedRequestNumber();
    const publishResult = (action: Actions) => {
      runtime.completedRequestNumberByKey.set(
        requestKey,
        Math.max(requestNumber, completedRequestNumber())
      );
      dispatchStateAction(dispatch, action);
    };

    let countedInGlobalLoading = false;
    const stopGlobalLoading = () => {
      if (countedInGlobalLoading) {
        countedInGlobalLoading = false;
        dispatchStateAction(dispatch, globalLoadingDecrementAction());
      }
    };

    let cancelRetryDelay: () => void = () => undefined;
    const cancelExecution = () => {
      if (activeRequest.canceled) {
        return;
      }

      activeRequest.canceled = true;
      unregisterRequestCancellation();
      activeRequest.abortController?.abort();
      cancelRetryDelay();
      activeRequest.resolveCancellation();
      clearTimeout(activeRequest.globalLoadingTimeoutId);

      if (canPublishResult()) {
        dispatchStateAction(dispatch, commonRequestCancelAction(meta));
      }
      stopGlobalLoading();

      if (useDebounce) {
        runtime.memoizedDoRequest = getMemoizedDoRequest();
      }
    };

    activeRequest.cancel = cancelExecution;
    const unregisterRequestCancellation =
      registerRequestCancellation(cancelExecution);

    const waitForRetry = (delay: number) => {
      if (delay <= 0) {
        return Promise.resolve(true);
      }

      return new Promise<boolean>((resolve) => {
        const finish = (completed: boolean) => {
          clearTimeout(timeoutId);
          cancelRetryDelay = () => undefined;
          resolve(completed);
        };
        const timeoutId = setTimeout(() => finish(true), delay);
        cancelRetryDelay = () => finish(false);
      });
    };

    const requestLifecyclePromise = (async () => {
      try {
        dispatchStateAction(dispatch, commonRequestStartAction(meta));

        if (includeInGlobalLoading && !silent && !activeRequest.canceled) {
          countedInGlobalLoading = true;
          dispatchStateAction(dispatch, globalLoadingIncrementAction());
          if (globalLoadingTimeout && countedInGlobalLoading) {
            activeRequest.globalLoadingTimeoutId = setTimeout(
              stopGlobalLoading,
              globalLoadingTimeout
            );
          }
        }

        const configuredMaxRetries = retry?.maxRetries ?? 0;
        const maxRetries = Number.isFinite(configuredMaxRetries)
          ? Math.max(0, Math.floor(configuredMaxRetries))
          : 0;
        let attempt = 0;

        while (!activeRequest.canceled && canPublishResult()) {
          attempt += 1;
          let response: Resp;

          try {
            response = await request(params, {
              signal: abortController?.signal,
            });
          } catch (error) {
            if (activeRequest.canceled || !canPublishResult()) {
              break;
            }

            let transformedError: Err;
            let retryDelay: number | undefined;

            try {
              transformedError = transformError<Err>(error);
              const retriesUsed = attempt - 1;
              const retryContext = {
                error: transformedError,
                params,
                attempt,
                retriesLeft: Math.max(0, maxRetries - retriesUsed),
              };

              if (
                retriesUsed < maxRetries &&
                (retry?.shouldRetry?.(retryContext) ?? true)
              ) {
                const configuredDelay =
                  typeof retry?.delay === 'function'
                    ? retry.delay(retryContext)
                    : (retry?.delay ?? 0);
                retryDelay = Number.isFinite(configuredDelay)
                  ? Math.max(0, configuredDelay)
                  : 0;
              }
            } catch (retryPolicyError) {
              if (!activeRequest.canceled && canPublishResult()) {
                publishResult(commonRequestErrorAction(meta, error));
              }
              throw retryPolicyError;
            }

            if (activeRequest.canceled || !canPublishResult()) {
              break;
            }
            if (retryDelay !== undefined) {
              if (await waitForRetry(retryDelay)) {
                continue;
              }
              break;
            }

            publishResult(commonRequestErrorAction(meta, error));
            if (isRequestRejectedActionNeeded) {
              dispatch(
                requestRejectedAction({ params, error: transformedError }, meta)
              );
            }
            dispatchRejectedActions(dispatch, {
              request: params,
              error: transformedError,
              state: getState(),
            });
            break;
          }

          if (!activeRequest.canceled && canPublishResult()) {
            publishResult(commonRequestSuccessAction(meta, response));
            if (isRequestFulfilledActionNeeded) {
              dispatch(requestFulfilledAction({ params, response }, meta));
            }
            dispatchFulfilledActions(dispatch, {
              request: params,
              response,
              state: getState(),
            });
          }
          break;
        }
      } finally {
        unregisterRequestCancellation();
        cancelRetryDelay = () => undefined;
        clearTimeout(activeRequest.globalLoadingTimeoutId);
        deleteRequestFromMap(
          runtime.doRequestMapByKey,
          requestKey,
          requestNumber
        );
        if (!runtime.doRequestMapByKey.has(requestKey)) {
          runtime.completedRequestNumberByKey.delete(requestKey);
        }
        stopGlobalLoading();
      }
    })();

    return Promise.race([requestLifecyclePromise, cancellationPromise]);
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

  const requestFactoryRuntimeKey = {};
  const createRuntimeState = (): RequestRuntimeState => ({
    doRequestMapByKey: new Map(),
    loadAttemptHydrationVersionByKey: new Map(),
    lastRequestNumber: 0,
    completedRequestNumberByKey: new Map(),
    loadPromiseStateMapByKey: new Map(),
    memoizedDoRequest: getMemoizedDoRequest(),
  });

  const getDoRequestAction =
    (mode: RequestMode) =>
    ({
      params,
      meta,
      requestKey,
      silent,
    }: {
      params: Params;
      requestKey: string;
      meta: RequestActionMeta;
      silent: boolean;
    }) =>
    ({
      dispatch,
      getState,
      getRuntimeState,
      registerRequestCancellation,
      middlewareConfig,
      getRequestHydrationVersion,
    }: ActionPropsFromMiddleware<State>) => {
      const runtime = getRuntimeState(
        requestFactoryRuntimeKey,
        createRuntimeState
      );
      const cachedLoadPromiseState =
        runtime.loadPromiseStateMapByKey.get(requestKey);
      const isForced = mode !== 'load';

      if (!isForced && cachedLoadPromiseState?.status === 'pending') {
        return cachedLoadPromiseState.promise;
      }

      const resolvedLoadDataRetryStatuses =
        loadDataRetryStatuses ??
        middlewareConfig.loadDataRetryStatuses ??
        defaultLoadDataRetryStatuses;
      const resolvedIncludeInGlobalLoading =
        includeInGlobalLoading ?? middlewareConfig.globalLoadingEnabled ?? true;
      const resolvedLoadDataHydratedRetryStatuses =
        loadDataHydratedRetryStatuses ??
        middlewareConfig.loadDataHydratedRetryStatuses ??
        resolvedLoadDataRetryStatuses;
      const hydrationVersion = getRequestHydrationVersion(requestKey);
      // A local SSR request records generation 0 before it starts, so its
      // terminal state uses loadDataRetryStatuses. A new client middleware has
      // no recorded attempt for preloaded terminal state and may use
      // loadDataHydratedRetryStatuses once. Each matching hydrate action bumps
      // the generation and makes one new hydrated retry possible.
      const canRetryHydratedState =
        runtime.loadAttemptHydrationVersionByKey.get(requestKey) !==
        hydrationVersion;

      if (
        isForced ||
        isNeedLoadData(
          config,
          meta,
          getState(),
          staleTime,
          resolvedLoadDataRetryStatuses,
          resolvedLoadDataHydratedRetryStatuses,
          canRetryHydratedState
        )
      ) {
        // Claim this hydration generation before starting work. Concurrent
        // dispatches then reuse the in-flight Promise and a failed or canceled
        // client retry cannot consume the same hydrated allowance again.
        runtime.loadAttemptHydrationVersionByKey.set(
          requestKey,
          hydrationVersion
        );
        const execution = { canceled: false, started: false };
        let resolveRequest!: () => void;
        let rejectRequest!: (error: unknown) => void;
        const requestPromise = new Promise<void>((resolve, reject) => {
          resolveRequest = resolve;
          rejectRequest = reject;
        });
        const cancelPendingExecution = () => {
          if (execution.canceled) {
            return;
          }

          execution.canceled = true;
          resolveRequest();

          if (!execution.started) {
            dispatchStateAction(dispatch, commonRequestCancelAction(meta));

            if (useDebounce) {
              runtime.memoizedDoRequest = getMemoizedDoRequest();
            }
          }
        };
        const unregisterRequestCancellation = registerRequestCancellation(
          cancelPendingExecution
        );
        const loadPromiseState: LoadPromiseState = {
          status: 'pending',
          promise: requestPromise,
        };

        runtime.loadPromiseStateMapByKey.set(requestKey, loadPromiseState);

        const settlePromise = (status: 'fulfilled' | 'rejected') => {
          unregisterRequestCancellation();
          loadPromiseState.status = status;
        };

        requestPromise.then(
          () => settlePromise('fulfilled'),
          () => settlePromise('rejected')
        );

        try {
          Promise.resolve(
            (useDebounce ? runtime.memoizedDoRequest : doRequest)({
              params,
              dispatch,
              meta,
              requestKey,
              getState,
              silent,
              mode,
              includeInGlobalLoading: resolvedIncludeInGlobalLoading,
              runtime,
              registerRequestCancellation,
              execution,
            })
          ).then(resolveRequest, rejectRequest);
        } catch (error) {
          rejectRequest(error);
        }

        return requestPromise;
      }

      const dispatchCachedFulfilledActions =
        dispatchFulfilledActionForLoadedRequest &&
        isRequestFulfilledActionNeeded;
      const cachedPromiseRejected =
        cachedLoadPromiseState?.status === 'rejected';
      const isFulfilled =
        (dispatchCachedFulfilledActions || cachedPromiseRejected) &&
        isRequestFulfilled(config, meta, getState());

      let cachedPromise = cachedLoadPromiseState?.promise;
      if (!cachedPromise || (cachedPromiseRejected && isFulfilled)) {
        // A fulfilled callback can reject the command after Redux stores the
        // response. Cache hits for that response use a stable fulfilled Promise.
        cachedPromise = Promise.resolve();
        runtime.loadPromiseStateMapByKey.set(requestKey, {
          status: 'fulfilled',
          promise: cachedPromise,
        });
      }

      if (dispatchCachedFulfilledActions && isFulfilled) {
        const response = getResponse(config, meta, getState());

        dispatch(requestFulfilledAction({ params, response }, meta));
        dispatchFulfilledActions(dispatch, {
          request: params,
          response, // TODO use transform response
          state: getState(),
        });
      }

      return cachedPromise;
    };

  return new Proxy(
    {
      doRequestAction: createAsyncAction(
        `${FactoryActionTypes.DoRequest}/${stateRequestKey}`,
        getDoRequestAction('direct'),
        identity
      ),
      forcedLoadDataAction: createAsyncAction(
        `${FactoryActionTypes.ForcedLoadData}/${stateRequestKey}`,
        getDoRequestAction('reload'),
        identity
      ),
      loadDataAction: createAsyncAction(
        `${FactoryActionTypes.LoadData}/${stateRequestKey}`,
        getDoRequestAction('load'),
        identity
      ),
      cancelRequestAction: createAsyncAction(
        `${FactoryActionTypes.CancelRequest}/${stateRequestKey}`,
        ({ requestKey }) => {
          return ({ getRuntimeState }: ActionPropsFromMiddleware<State>) => {
            const runtime = getRuntimeState(
              requestFactoryRuntimeKey,
              createRuntimeState
            );

            cancelRequestInMap(runtime.doRequestMapByKey, requestKey);
          };
        },
        identity
      ),
      setErrorAction: createAsyncAction(
        `${FactoryActionTypes.SetError}/${stateRequestKey}`,
        ({ meta, data: { error }, params }) => {
          return async ({ dispatch }: ActionPropsFromMiddleware<State>) => {
            dispatchStateAction(
              dispatch,
              commonRequestErrorAction(meta, error)
            );
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
            dispatchStateAction(
              dispatch,
              commonRequestSuccessAction(meta, response)
            );
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
            dispatchStateAction(dispatch, commonRequestResetAction(meta));
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
