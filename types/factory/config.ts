export interface RequestFactoryConfigCommon<Err> {
  stateRequestKey: string;
  useDebounce?: boolean;
  debounceWait?: number;
  debounceOptions?: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  };
  transformError?: (error: any) => Err | null;
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
  Params
> = RequestFactoryConfigCommon<Err> & {
  request: (params?: Params) => Promise<Resp>;
  stringifyParamsForDebounce?: (params?: Params) => string;
};

export type RequestFactoryConfigWithParamsWithoutSerialize<
  Resp,
  Err,
  Params
> = RequestFactoryConfigCommon<Err> & {
  request: (params: Params) => Promise<Resp>;
  stringifyParamsForDebounce?: (params: Params) => string;
};

export type RequestFactoryConfigWithParamsWithSerialize<
  Resp,
  Err,
  Params
> = RequestFactoryConfigCommon<Err> & {
  request: (params: Params) => Promise<Resp>;
  stringifyParamsForDebounce?: (params: Params) => string;
  serializeRequestParameters: (params: Params) => string;
};

export type RequestFactoryConfigWithOptionalParamsWithoutSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  TransformedResp
> = RequestFactoryConfigWithOptionalParamsWithoutSerialize<Resp, Err, Params> &
  RequestFactoryConfigCommonWithTransformResponse<Resp, TransformedResp>;

export type RequestFactoryConfigWithParamsWithoutSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  TransformedResp
> = RequestFactoryConfigWithParamsWithoutSerialize<Resp, Err, Params> &
  RequestFactoryConfigCommonWithTransformResponse<Resp, TransformedResp>;

export type RequestFactoryConfigWithParamsWithSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  TransformedResp
> = RequestFactoryConfigWithParamsWithSerialize<Resp, Err, Params> &
  RequestFactoryConfigCommonWithTransformResponse<Resp, TransformedResp>;

export type RequestFactoryConfigWithTransformResponse<
  Resp,
  Err,
  Params,
  TransformedResp
> =
  | RequestFactoryConfigWithOptionalParamsWithoutSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      TransformedResp
    >
  | RequestFactoryConfigWithParamsWithoutSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      TransformedResp
    >
  | RequestFactoryConfigWithParamsWithSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      TransformedResp
    >;

export type RequestFactoryConfig<Resp, Err, Params, TransformedResp> =
  | RequestFactoryConfigWithOptionalParamsWithoutSerialize<Resp, Err, Params>
  | RequestFactoryConfigWithParamsWithoutSerialize<Resp, Err, Params>
  | RequestFactoryConfigWithParamsWithSerialize<Resp, Err, Params>
  | RequestFactoryConfigWithTransformResponse<
      Resp,
      Err,
      Params,
      TransformedResp
    >;
