import { Action } from 'redux';

export interface RequestFactoryConfigCommon<Resp, Err, Params, State> {
  stateRequestKey: string;
  useDebounce?: boolean;
  debounceWait?: number;
  debounceOptions?: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  };
  transformError?: (error: any) => Err | null;
  fulfilledActions?: (
    | ((data: { request?: Params; response: Resp; state: State }) => Action)
    | Action
  )[];
  rejectedActions?: (
    | ((data: { request?: Params; error: Err; state: State }) => Action)
    | Action
  )[];
}

export type RequestFactoryConfigCommonWithTransformResponse<
  Resp,
  TransformedResp
> = {
  transformResponse: (response: Resp | null) => TransformedResp;
};

export type RequestFactoryConfigWithOptionalParamsWithoutSerialize<
  Resp,
  Err,
  Params,
  State
> = RequestFactoryConfigCommon<Resp, Err, Params, State> & {
  request: (params?: Params) => Promise<Resp>;
  stringifyParamsForDebounce?: (params?: Params) => string;
};

export type RequestFactoryConfigWithParamsWithoutSerialize<
  Resp,
  Err,
  Params,
  State
> = RequestFactoryConfigCommon<Resp, Err, Params, State> & {
  request: (params: Params) => Promise<Resp>;
  stringifyParamsForDebounce?: (params: Params) => string;
};

export type RequestFactoryConfigWithParamsWithSerialize<
  Resp,
  Err,
  Params,
  State
> = RequestFactoryConfigCommon<Resp, Err, Params, State> & {
  request: (params: Params) => Promise<Resp>;
  stringifyParamsForDebounce?: (params: Params) => string;
  serializeRequestParameters: (params: Params) => string;
};

export type RequestFactoryConfigWithOptionalParamsWithoutSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp
> = RequestFactoryConfigWithOptionalParamsWithoutSerialize<
  Resp,
  Err,
  Params,
  State
> &
  RequestFactoryConfigCommonWithTransformResponse<Resp, TransformedResp>;

export type RequestFactoryConfigWithParamsWithoutSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp
> = RequestFactoryConfigWithParamsWithoutSerialize<Resp, Err, Params, State> &
  RequestFactoryConfigCommonWithTransformResponse<Resp, TransformedResp>;

export type RequestFactoryConfigWithParamsWithSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp
> = RequestFactoryConfigWithParamsWithSerialize<Resp, Err, Params, State> &
  RequestFactoryConfigCommonWithTransformResponse<Resp, TransformedResp>;

export type RequestFactoryConfigWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp
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
