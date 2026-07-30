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

  const requestFulfilledAction = createSyncAction(
    `${FactoryActionTypes.RequestFulfilled}/${stateRequestKey}`
  );

  const requestRejectedAction = createSyncAction(
    `${FactoryActionTypes.RequestRejected}/${stateRequestKey}`
  );

  type DoRequestArgs = {
    params: Params;
    dispatch: Dispatch;
    meta: RequestActionMeta;
    requestKey: string;
    getState: () => State;
    silent: boolean;
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
    pending: boolean;
    promise: Promise<void>;
  };

  type RequestRuntimeState = {
    doRequestMapByKey: DoRequestMapByKey;
    // The hydration generation for which this middleware runtime most recently
    // started work. A missing entry differs from initial generation 0, allowing
    // one retry for terminal state supplied through initial preloaded state.
    loadAttemptHydrationVersionByKey: Map<string, number>;
    lastRequestNumber: number;
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
      resolveCancellation,
      silent
    );

    let unregisterRequestCancellation: () => void = () => undefined;
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

      dispatch(commonRequestCancelAction(meta));
      clearTimeout(activeRequest.globalLoadingTimeoutId);

      if (
        includeInGlobalLoading &&
        !activeRequest.silent &&
        !activeRequest.globalLoadingDecrementedAfterTimeout
      ) {
        dispatch(globalLoadingDecrementAction());
      }

      if (useDebounce) {
        runtime.memoizedDoRequest = getMemoizedDoRequest();
      }
    };

    activeRequest.cancel = cancelExecution;
    unregisterRequestCancellation =
      registerRequestCancellation(cancelExecution);

    dispatch(commonRequestStartAction(meta));

    if (includeInGlobalLoading && !silent) {
      dispatch(globalLoadingIncrementAction());
    }

    if (globalLoadingTimeout) {
      activeRequest.globalLoadingTimeoutId = setTimeout(() => {
        if (
          !isRequestCanceled(
            runtime.doRequestMapByKey,
            requestKey,
            requestNumber
          )
        ) {
          if (includeInGlobalLoading && !silent) {
            activeRequest.globalLoadingDecrementedAfterTimeout = true;

            dispatch(globalLoadingDecrementAction());
          }
        }
      }, globalLoadingTimeout);
    }

    const waitForRetry = (delay: number) => {
      if (delay <= 0) {
        return Promise.resolve(true);
      }

      return new Promise<boolean>((resolve) => {
        let settled = false;
        const finish = (completed: boolean) => {
          if (settled) {
            return;
          }

          settled = true;
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
        const configuredMaxRetries = retry?.maxRetries ?? 0;
        const maxRetries = Number.isFinite(configuredMaxRetries)
          ? Math.max(0, Math.floor(configuredMaxRetries))
          : 0;
        let attempt = 0;

        while (true) {
          attempt += 1;

          try {
            const response = await request(params, {
              signal: abortController?.signal,
            });

            clearTimeout(activeRequest.globalLoadingTimeoutId);

            if (
              !isRequestCanceled(
                runtime.doRequestMapByKey,
                requestKey,
                requestNumber
              )
            ) {
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

            break;
          } catch (error) {
            if (
              isRequestCanceled(
                runtime.doRequestMapByKey,
                requestKey,
                requestNumber
              )
            ) {
              break;
            }

            let transformedError: Err;

            try {
              transformedError = transformError<Err>(error);
            } catch (retryPolicyError) {
              // Preserve the original lifecycle guarantee even when user
              // supplied error transformation cannot evaluate retry policy.
              dispatch(commonRequestErrorAction(meta, error));
              throw retryPolicyError;
            }

            const retriesUsed = attempt - 1;
            const retryContext = {
              error: transformedError,
              params,
              attempt,
              retriesLeft: Math.max(0, maxRetries - retriesUsed),
            };
            let shouldRetry: boolean;

            try {
              shouldRetry =
                retriesUsed < maxRetries &&
                (retry?.shouldRetry?.(retryContext) ?? true);
            } catch (retryPolicyError) {
              dispatch(commonRequestErrorAction(meta, error));
              throw retryPolicyError;
            }

            if (shouldRetry) {
              let configuredDelay: number;

              try {
                configuredDelay =
                  typeof retry?.delay === 'function'
                    ? retry.delay(retryContext)
                    : (retry?.delay ?? 0);
              } catch (retryPolicyError) {
                dispatch(commonRequestErrorAction(meta, error));
                throw retryPolicyError;
              }

              const retryDelay = Number.isFinite(configuredDelay)
                ? Math.max(0, configuredDelay)
                : 0;
              const delayCompleted = await waitForRetry(retryDelay);

              if (
                delayCompleted &&
                !isRequestCanceled(
                  runtime.doRequestMapByKey,
                  requestKey,
                  requestNumber
                )
              ) {
                continue;
              }

              break;
            }

            dispatch(commonRequestErrorAction(meta, error));
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

            break;
          }
        }
      } finally {
        unregisterRequestCancellation();
        cancelRetryDelay = () => undefined;
        clearTimeout(activeRequest.globalLoadingTimeoutId);

        if (
          includeInGlobalLoading &&
          !silent &&
          !isRequestCanceled(
            runtime.doRequestMapByKey,
            requestKey,
            requestNumber
          ) &&
          !activeRequest.globalLoadingDecrementedAfterTimeout
        ) {
          dispatch(globalLoadingDecrementAction());
        }

        deleteRequestFromMap(
          runtime.doRequestMapByKey,
          requestKey,
          requestNumber
        );
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
    loadPromiseStateMapByKey: new Map(),
    memoizedDoRequest: getMemoizedDoRequest(),
  });

  const getDoRequestAction =
    (isForced: boolean = true) =>
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

      if (!isForced && cachedLoadPromiseState?.pending) {
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
        let executionPromise: Promise<void>;

        try {
          executionPromise = Promise.resolve(
            (useDebounce ? runtime.memoizedDoRequest : doRequest)({
              params,
              dispatch,
              meta,
              requestKey,
              getState,
              silent,
              includeInGlobalLoading: resolvedIncludeInGlobalLoading,
              runtime,
              registerRequestCancellation,
              execution,
            })
          );
        } catch (error) {
          executionPromise = Promise.reject(error);
        }

        let resolveCancellation!: () => void;
        const cancellationPromise = new Promise<void>((resolve) => {
          resolveCancellation = resolve;
        });
        const cancelPendingExecution = () => {
          if (execution.canceled) {
            return;
          }

          execution.canceled = true;
          resolveCancellation();

          if (!execution.started) {
            dispatch(commonRequestCancelAction(meta));

            if (useDebounce) {
              runtime.memoizedDoRequest = getMemoizedDoRequest();
            }
          }
        };
        const unregisterRequestCancellation = registerRequestCancellation(
          cancelPendingExecution
        );
        const requestPromise = Promise.race([
          executionPromise,
          cancellationPromise,
        ]);
        const loadPromiseState: LoadPromiseState = {
          pending: true,
          promise: requestPromise,
        };

        runtime.loadPromiseStateMapByKey.set(requestKey, loadPromiseState);

        const settlePromise = () => {
          unregisterRequestCancellation();

          if (
            runtime.loadPromiseStateMapByKey.get(requestKey) ===
            loadPromiseState
          ) {
            loadPromiseState.pending = false;
          }
        };

        requestPromise.then(settlePromise, settlePromise);

        return requestPromise;
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

      if (cachedLoadPromiseState) {
        return cachedLoadPromiseState.promise;
      }

      // Hydrated success or a terminal state excluded from retry has no
      // Promise in this new middleware runtime. Create one stable fulfilled
      // thenable and retain it so React can retry the render without receiving
      // a fresh Promise on every dispatch.
      const settledPromise = Promise.resolve();
      runtime.loadPromiseStateMapByKey.set(requestKey, {
        pending: false,
        promise: settledPromise,
      });

      return settledPromise;
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
