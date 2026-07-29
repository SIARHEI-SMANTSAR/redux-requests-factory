import memoize from 'lodash.memoize';
import debounce from 'lodash.debounce';

import {
  RequestFactoryConfig,
  RequestActionMeta,
  RequestsStatuses,
  PreparedConfig,
  RequestFactoryConfigWithParamsWithSerialize,
  RequestFactoryConfigWithTransformResponse,
  DoRequestMapByKey,
  ActiveRequestState,
} from '../types';
import { RESPONSES_STATE_KEY } from '../constants';

export const actionToObject = function toObject(this: any) {
  return {
    type: this.type,
    meta: this.meta,
    payload: this.payload,
  };
};

export const actionToString = function toString(this: any) {
  return JSON.stringify({
    type: this.type,
    meta: this.meta,
    payload: this.payload,
  });
};

export const isWithSerialize = <Resp, Err, Params, State, TransformedResp>(
  config: RequestFactoryConfig<Resp, Err, Params, State, TransformedResp>
): config is RequestFactoryConfigWithParamsWithSerialize<
  Resp,
  Err,
  Params,
  State
> =>
  (
    config as RequestFactoryConfigWithParamsWithSerialize<
      Resp,
      Err,
      Params,
      State
    >
  ).serializeRequestParameters !== undefined;

export const isWithTransformResponse = <
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
>(
  config: RequestFactoryConfig<Resp, Err, Params, State, TransformedResp>
): config is RequestFactoryConfigWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp
> =>
  (
    config as RequestFactoryConfigWithTransformResponse<
      Resp,
      Err,
      Params,
      State,
      TransformedResp
    >
  ).transformResponse !== undefined;

export const getByPath =
  <Value = any, Object = any>(...keys: (string | undefined)[]) =>
  (obj: Object): Value | undefined =>
    keys
      .filter((key): key is string => key !== undefined)
      .reduce<Value | undefined>(
        (value: any, key) => (value ? value[key as string] : undefined),
        obj as any
      );

export const getRequestKey = ({
  key,
  serializedKey,
}: RequestActionMeta): string => `${key}_${serializedKey || ''}`;

export const getSerializedKey = <Resp, Err, Params, State, TransformedResp>(
  factoryConfig: RequestFactoryConfig<
    Resp,
    Err,
    Params,
    State,
    TransformedResp
  >,
  params: Params
): string | undefined =>
  isWithSerialize(factoryConfig)
    ? factoryConfig.serializeRequestParameters(params)
    : undefined;

export const isFactoryAction = (type: string) =>
  /^@@REDUX_REQUESTS_FACTORY\//.test(type);

export const memoizeDebounce = function <
  Func extends (this: any, ...args: any) => any,
>(func: Func, wait = 0, options: any = {}): Func {
  const mem = memoize(function (..._memoizeArgs: any[]) {
    let invokedSynchronously = false;
    let trailingDeferred:
      | {
          promise: Promise<unknown>;
          reject: (error: unknown) => void;
          resolve: (value: unknown) => void;
        }
      | undefined;

    const debounced = debounce(
      function (this: any, ...args: any[]) {
        invokedSynchronously = true;
        const deferred = trailingDeferred;
        trailingDeferred = undefined;

        try {
          const result = func.apply(this, args);
          if (deferred) {
            Promise.resolve(result).then(deferred.resolve, deferred.reject);
          }
          return result;
        } catch (error) {
          deferred?.reject(error);
          throw error;
        }
      },
      wait,
      options
    );

    return function (this: any, ...args: any[]) {
      invokedSynchronously = false;
      const result = debounced.apply(this, args);

      if (invokedSynchronously || options.trailing === false) {
        return result;
      }

      if (!trailingDeferred) {
        let resolve!: (value: unknown) => void;
        let reject!: (error: unknown) => void;
        const promise = new Promise<unknown>(
          (promiseResolve, promiseReject) => {
            resolve = promiseResolve;
            reject = promiseReject;
          }
        );
        trailingDeferred = { promise, reject, resolve };
      }

      return trailingDeferred.promise;
    };
  }, options.resolver);

  return function (this: any, ...args: any[]) {
    return mem.apply(this, args).apply(this, args);
  } as Func;
};

export const patchConfig = <Resp, Err, Params, State, TransformedResp, Key>(
  config: RequestFactoryConfig<Resp, Err, Params, State, TransformedResp>,
  preparedConfig: PreparedConfig<Key>
): RequestFactoryConfig<Resp, Err, Params, State, TransformedResp> => ({
  ...config,
  stateRequestKey: preparedConfig.registerRequestKey(config.stateRequestKey),
});

export const isNeedLoadData = <State, Key extends string>(
  { stateRequestsKey }: PreparedConfig<Key>,
  { key, serializedKey }: RequestActionMeta,
  state: State,
  staleTime: number
) => {
  const requestState = getByPath<
    { status?: RequestsStatuses; fulfilledAt?: number },
    State
  >(
    stateRequestsKey,
    RESPONSES_STATE_KEY,
    key,
    serializedKey
  )(state);

  if (requestState?.status === RequestsStatuses.Loading) {
    return false;
  }

  if (requestState?.status !== RequestsStatuses.Success) {
    return true;
  }

  if (staleTime === Infinity) {
    return false;
  }

  return (
    requestState.fulfilledAt === undefined ||
    Date.now() - requestState.fulfilledAt >= staleTime
  );
};

export const isRequestFulfilled = <State, Key extends string>(
  { stateRequestsKey }: PreparedConfig<Key>,
  { key, serializedKey }: RequestActionMeta,
  state: State
) => {
  const status = getByPath<RequestsStatuses, State>(
    stateRequestsKey,
    RESPONSES_STATE_KEY,
    key,
    serializedKey,
    'status'
  )(state);

  return status === RequestsStatuses.Success;
};

export const getResponse = <State, Key extends string>(
  { stateRequestsKey }: PreparedConfig<Key>,
  { key, serializedKey }: RequestActionMeta,
  state: State
) => {
  const response = getByPath<any, State>(
    stateRequestsKey,
    RESPONSES_STATE_KEY,
    key,
    serializedKey,
    'response'
  )(state);

  return response;
};

export const identity = <T>(a: T): T => a;

export const setNewRequestToMap = (
  doRequestMapByKey: DoRequestMapByKey,
  requestKey: string,
  requestNumber: number,
  abortController: AbortController | undefined,
  resolveCancellation: () => void,
  silent: boolean
): ActiveRequestState => {
  const requestState: ActiveRequestState = {
    abortController,
    canceled: false,
    globalLoadingDecrementedAfterTimeout: false,
    resolveCancellation,
    silent,
  };

  if (doRequestMapByKey.has(requestKey)) {
    doRequestMapByKey.get(requestKey)?.set(requestNumber, requestState);
  } else {
    doRequestMapByKey.set(requestKey, new Map([[requestNumber, requestState]]));
  }

  return requestState;
};

export const isRequestCanceled = (
  doRequestMapByKey: DoRequestMapByKey,
  requestKey: string,
  requestNumber: number
) => doRequestMapByKey.get(requestKey)!.get(requestNumber)!.canceled;

export const deleteRequestFromMap = (
  doRequestMapByKey: DoRequestMapByKey,
  requestKey: string,
  requestNumber: number
) => {
  const requestsByNumber = doRequestMapByKey.get(requestKey);
  requestsByNumber?.delete(requestNumber);

  if (requestsByNumber?.size === 0) {
    doRequestMapByKey.delete(requestKey);
  }
};

export const cancelRequestInMap = (
  doRequestMapByKey: DoRequestMapByKey,
  requestKey: string
): ActiveRequestState | undefined => {
  if (doRequestMapByKey.has(requestKey)) {
    const doRequestMap = doRequestMapByKey.get(requestKey);
    if (doRequestMap) {
      const entries = Array.from(doRequestMap);
      if (entries.length > 0) {
        const [requestNumber] = entries[entries.length - 1];
        const statusObj = doRequestMap.get(requestNumber);
        if (statusObj && statusObj.canceled === false) {
          statusObj.cancel?.();

          return statusObj;
        }
      }
    }
  }
  return undefined;
};
