export type RequestsFactoryItemSelectorsWithoutSerialize<
  Resp,
  Err,
  _Params,
  State
> = {
  responseSelector: (state: State) => Resp | null;
  errrorSelector: (state: State) => Err | null;
};

export type RequestsFactoryItemSelectorsWithoutSerializeWithTransformResponse<
  _Resp,
  Err,
  _Params,
  State,
  TransformedResp
> = {
  responseSelector: (state: State) => TransformedResp;
  errrorSelector: (state: State) => Err | null;
};

export type RequestsFactoryItemSelectorsWithSerialize<
  Resp,
  Err,
  Params,
  State
> = {
  responseSelector: (state: State) => (params: Params) => Resp | null;
  errrorSelector: (state: State) => (params: Params) => Err | null;
};

export type RequestsFactoryItemSelectorsWithSerializeWithTransformResponse<
  _Resp,
  Err,
  Params,
  State,
  TransformedResp
> = {
  responseSelector: (state: State) => (params: Params) => TransformedResp;
  errrorSelector: (state: State) => (params: Params) => Err | null;
};

export type RequestsFactoryItemSelectors<
  Resp,
  Err,
  Params,
  State,
  TransformedResp
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
