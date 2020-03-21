export type RequestsFactoryItemSelectorsWithoutSerialize<
  Resp,
  Err,
  _Params,
  State
> = {
  responseSelector: (state: State) => Resp | null;
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

export type RequestsFactoryItemSelectors<Resp, Err, Params, State> =
  | RequestsFactoryItemSelectorsWithSerialize<Resp, Err, Params, State>
  | RequestsFactoryItemSelectorsWithoutSerialize<Resp, Err, Params, State>;
