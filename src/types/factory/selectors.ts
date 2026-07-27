import { RequestsStatuses } from '../reducer';

type RequestsFactoryItemCommonSelectorsWithoutSerialize<
  _Resp,
  Err,
  _Params,
  State,
> = {
  /** Returns the current request error, transformed when configured. */
  errorSelector: (state: State) => Err;
  /** Returns the current request lifecycle status. */
  requestStatusSelector: (state: State) => RequestsStatuses;
  /** Returns whether the request is currently loading. */
  isLoadingSelector: (state: State) => boolean;
  /** Returns whether the request completed successfully. */
  isLoadedSelector: (state: State) => boolean;
};

type RequestsFactoryItemCommonSelectorsWithSerialize<
  _Resp,
  Err,
  Params,
  State,
> = {
  /** Returns a params selector for the current request error. */
  errorSelector: (state: State) => (params: Params) => Err;
  /** Returns a params selector for the current request lifecycle status. */
  requestStatusSelector: (state: State) => (params: Params) => RequestsStatuses;
  /** Returns a params selector indicating whether the request is loading. */
  isLoadingSelector: (state: State) => (params: Params) => boolean;
  /** Returns a params selector indicating whether the request succeeded. */
  isLoadedSelector: (state: State) => (params: Params) => boolean;
};

/** Selectors for a request with one cache entry and its original response type. */
export type RequestsFactoryItemSelectorsWithoutSerialize<
  Resp,
  Err,
  Params,
  State,
> = RequestsFactoryItemCommonSelectorsWithoutSerialize<
  Resp,
  Err,
  Params,
  State
> & {
  /** Returns the stored response, or `undefined` before a response exists. */
  responseSelector: (state: State) => Resp | undefined;
};

/** Selectors for one cache entry with a transformed response result. */
export type RequestsFactoryItemSelectorsWithoutSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
> = RequestsFactoryItemCommonSelectorsWithoutSerialize<
  Resp,
  Err,
  Params,
  State
> & {
  /** Returns the value produced by `transformResponse`. */
  responseSelector: (state: State) => TransformedResp;
};

/** Parameterized selectors whose responses retain their original type. */
export type RequestsFactoryItemSelectorsWithSerialize<
  Resp,
  Err,
  Params,
  State,
> = RequestsFactoryItemCommonSelectorsWithSerialize<
  Resp,
  Err,
  Params,
  State
> & {
  /** Returns a params selector for the stored response. */
  responseSelector: (state: State) => (params: Params) => Resp | undefined;
};

/** Parameterized selectors whose responses are transformed. */
export type RequestsFactoryItemSelectorsWithSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
> = RequestsFactoryItemCommonSelectorsWithSerialize<
  Resp,
  Err,
  Params,
  State
> & {
  /** Returns a params selector for the value produced by `transformResponse`. */
  responseSelector: (state: State) => (params: Params) => TransformedResp;
};

/** Union of every selector set returned by `requestsFactory`. */
export type RequestsFactoryItemSelectors<
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
> =
  | RequestsFactoryItemSelectorsWithSerialize<Resp, Err, Params, State>
  | RequestsFactoryItemSelectorsWithoutSerialize<Resp, Err, Params, State>
  | RequestsFactoryItemSelectorsWithoutSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      State,
      TransformedResp
    >
  | RequestsFactoryItemSelectorsWithSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      State,
      TransformedResp
    >;
