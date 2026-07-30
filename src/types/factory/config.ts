import { Action } from 'redux';

import type { LoadDataRetryStatus } from '../reducer';

/** Runtime capabilities passed to every request implementation. */
export type RequestContext = {
  /**
   * Aborted when this execution is canceled. It is undefined only in runtimes
   * without a global AbortController; install a polyfill to enable transport
   * cancellation there.
   */
  signal?: AbortSignal;
};

/**
 * Additional Redux actions dispatched after a request succeeds or fails.
 * Entries may be static actions or factories that use request result data.
 */
export type ExternalActions<Data> = (
  | ((data: Data) => Action | (Action | null)[] | null)
  | Action
  | (Action | null)[]
  | null
)[];

/** Values passed to request retry policy callbacks after a failed attempt. */
export type RetryContext<Err, Params> = {
  /** Error transformed by the request factory's `transformError` function. */
  error: Err;
  /** Parameters used by the failed request. */
  params: Params;
  /** One-based number of the request attempt that failed. */
  attempt: number;
  /** Number of configured retries still available after this failure. */
  retriesLeft: number;
};

/** Automatic retry policy for one request factory. */
export type RetryConfig<Err, Params> = {
  /**
   * Maximum number of retries after the initial request attempt.
   * Values below zero are treated as zero.
   */
  maxRetries: number;
  /**
   * Delay before the next attempt in milliseconds. A callback can implement
   * exponential backoff, jitter, or server-specific rate-limit handling.
   * @default 0
   */
  delay?: number | ((context: RetryContext<Err, Params>) => number);
  /**
   * Decides whether a failed attempt should be retried. When omitted, every
   * failure is retried until `maxRetries` is exhausted.
   */
  shouldRetry?: (context: RetryContext<Err, Params>) => boolean;
};

/** Options shared by every request factory configuration. */
export interface RequestFactoryConfigCommon<_Resp, Err, _Params, _State> {
  /** Unique key used to store this request in the requests reducer. */
  stateRequestKey: string;
  /** Enables per-parameter debounce for request-starting actions. @default false */
  useDebounce?: boolean;
  /** Debounce wait in milliseconds. @default 500 */
  debounceWait?: number;
  /** Options passed to `lodash.debounce`. */
  debounceOptions?: {
    /** Invoke on the leading edge. @default true */
    leading?: boolean;
    /** Invoke on the trailing edge. @default false */
    trailing?: boolean;
    /** Maximum delay before invocation. @default debounceWait */
    maxWait?: number;
  };
  /** Transforms errors exposed by selectors and failed-request side effects. */
  transformError?: (error: any) => Err;
  /**
   * Automatically retries failures within the same request lifecycle.
   * Intermediate failures do not update Redux or dispatch rejected actions.
   * @default undefined
   */
  retry?: RetryConfig<Err, _Params>;
  /**
   * Includes this request in global loading state. Overrides the middleware
   * setting.
   *
   * @default middleware globalLoadingEnabled, otherwise true
   */
  includeInGlobalLoading?: boolean;
  /**
   * Time in milliseconds for which a successful response is considered fresh.
   * A normal load refetches after this interval while retaining cached data
   * during the refresh. Use `Infinity` to keep the v2 permanent-cache behavior.
   * @default Infinity
   */
  staleTime?: number;
  /**
   * Terminal statuses on which `loadDataAction` starts another request.
   * Overrides the middleware setting for this request factory.
   *
   * @default [RequestsStatuses.Failed, RequestsStatuses.Canceled]
   */
  loadDataRetryStatuses?: readonly LoadDataRetryStatus[];
  /**
   * Terminal statuses imported into a new middleware runtime that
   * `loadDataAction` may retry once per hydration cycle and request key.
   * Overrides the middleware setting for this request factory.
   *
   * @default loadDataRetryStatuses
   */
  loadDataHydratedRetryStatuses?: readonly LoadDataRetryStatus[];
  /**
   * Re-dispatches fulfilled lifecycle side effects for an already cached load
   * when `requestFulfilledAction` has been enabled.
   *
   * @default false
   */
  dispatchFulfilledActionForLoadedRequest?: boolean;
  /** Removes a long-running request from global loading after this many milliseconds. */
  globalLoadingTimeout?: number;
}

/** Adds a selector-only response transformation to a request configuration. */
export type RequestFactoryConfigCommonWithTransformResponse<
  Resp,
  TransformedResp,
> = {
  /** Transforms the value returned by `responseSelector`; stored data is unchanged. */
  transformResponse: (response: Resp | undefined) => TransformedResp;
};

/** Configuration for a request with optional params and one shared cache entry. */
export type RequestFactoryConfigWithOptionalParamsWithoutSerialize<
  Resp,
  Err,
  Params,
  State,
> = RequestFactoryConfigCommon<Resp, Err, Params, State> & {
  /** Executes the asynchronous request. */
  request: (
    params: Params | undefined,
    context: RequestContext
  ) => Promise<Resp>;
  /** Creates the debounce key for a set of optional params. @default JSON.stringify */
  stringifyParamsForDebounce?: (params?: Params) => string;
  /** Additional actions dispatched after a successful request. */
  fulfilledActions?: ExternalActions<{
    request: Params | undefined;
    response: Resp;
    state: State;
  }>;
  /** Additional actions dispatched after a failed request. */
  rejectedActions?: ExternalActions<{
    request: Params | undefined;
    error: Err;
    state: State;
  }>;
};

/** Configuration for required params stored in one shared cache entry. */
export type RequestFactoryConfigWithParamsWithoutSerialize<
  Resp,
  Err,
  Params,
  State,
> = RequestFactoryConfigCommon<Resp, Err, Params, State> & {
  /** Executes the asynchronous request. */
  request: (params: Params, context: RequestContext) => Promise<Resp>;
  /** Creates the debounce key for a set of params. @default JSON.stringify */
  stringifyParamsForDebounce?: (params: Params) => string;
  /** Additional actions dispatched after a successful request. */
  fulfilledActions?: ExternalActions<{
    request: Params;
    response: Resp;
    state: State;
  }>;
  /** Additional actions dispatched after a failed request. */
  rejectedActions?: ExternalActions<{
    request: Params;
    error: Err;
    state: State;
  }>;
};

/** Configuration for required params with a separate cache entry per serialized key. */
export type RequestFactoryConfigWithParamsWithSerialize<
  Resp,
  Err,
  Params,
  State,
> = RequestFactoryConfigCommon<Resp, Err, Params, State> & {
  /** Executes the asynchronous request. */
  request: (params: Params, context: RequestContext) => Promise<Resp>;
  /** Creates the debounce key for a set of params. @default JSON.stringify */
  stringifyParamsForDebounce?: (params: Params) => string;
  /** Converts request params to the Redux cache key used by actions and selectors. */
  serializeRequestParameters: (params: Params) => string;
  /** Additional actions dispatched after a successful request. */
  fulfilledActions?: ExternalActions<{
    request: Params;
    response: Resp;
    state: State;
  }>;
  /** Additional actions dispatched after a failed request. */
  rejectedActions?: ExternalActions<{
    request: Params;
    error: Err;
    state: State;
  }>;
};

/** Optional-param configuration whose response selector is transformed. */
export type RequestFactoryConfigWithOptionalParamsWithoutSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
> = RequestFactoryConfigWithOptionalParamsWithoutSerialize<
  Resp,
  Err,
  Params,
  State
> &
  RequestFactoryConfigCommonWithTransformResponse<Resp, TransformedResp>;

/** Required-param configuration whose response selector is transformed. */
export type RequestFactoryConfigWithParamsWithoutSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
> = RequestFactoryConfigWithParamsWithoutSerialize<Resp, Err, Params, State> &
  RequestFactoryConfigCommonWithTransformResponse<Resp, TransformedResp>;

/** Serialized-param configuration whose response selector is transformed. */
export type RequestFactoryConfigWithParamsWithSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
> = RequestFactoryConfigWithParamsWithSerialize<Resp, Err, Params, State> &
  RequestFactoryConfigCommonWithTransformResponse<Resp, TransformedResp>;

/** Union of request configurations that transform selector responses. */
export type RequestFactoryConfigWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
> =
  | RequestFactoryConfigWithOptionalParamsWithoutSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      State,
      TransformedResp
    >
  | RequestFactoryConfigWithParamsWithoutSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      State,
      TransformedResp
    >
  | RequestFactoryConfigWithParamsWithSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      State,
      TransformedResp
    >;

/** Any configuration accepted by `requestsFactory`. */
export type RequestFactoryConfig<Resp, Err, Params, State, TransformedResp> =
  | RequestFactoryConfigWithOptionalParamsWithoutSerialize<
      Resp,
      Err,
      Params,
      State
    >
  | RequestFactoryConfigWithParamsWithoutSerialize<Resp, Err, Params, State>
  | RequestFactoryConfigWithParamsWithSerialize<Resp, Err, Params, State>
  | RequestFactoryConfigWithTransformResponse<
      Resp,
      Err,
      Params,
      State,
      TransformedResp
    >;
