import { RequestsStatuses } from '../reducer';

type RequestsFactoryItemCommonSelectorsWithoutSerialize<
  _Resp,
  Err,
  _Params,
  State
> = {
  errorSelector: (state: State) => Err;
  requestStatusSelector: (state: State) => RequestsStatuses;
  isLoadingSelector: (state: State) => boolean;
  isLoadedSelector: (state: State) => boolean;
};

type RequestsFactoryItemCommonSelectorsWithSerialize<
  _Resp,
  Err,
  Params,
  State
> = {
  errorSelector: (state: State) => (params: Params) => Err;
  requestStatusSelector: (state: State) => (params: Params) => RequestsStatuses;
  isLoadingSelector: (state: State) => (params: Params) => boolean;
  isLoadedSelector: (state: State) => (params: Params) => boolean;
};

export type RequestsFactoryItemSelectorsWithoutSerialize<
  Resp,
  Err,
  Params,
  State
> = RequestsFactoryItemCommonSelectorsWithoutSerialize<
  Resp,
  Err,
  Params,
  State
> & {
  responseSelector: (state: State) => Resp | undefined;
};

export type RequestsFactoryItemSelectorsWithoutSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp
> = RequestsFactoryItemCommonSelectorsWithoutSerialize<
  Resp,
  Err,
  Params,
  State
> & {
  responseSelector: (state: State) => TransformedResp;
};

export type RequestsFactoryItemSelectorsWithSerialize<
  Resp,
  Err,
  Params,
  State
> = RequestsFactoryItemCommonSelectorsWithSerialize<
  Resp,
  Err,
  Params,
  State
> & {
  responseSelector: (state: State) => (params: Params) => Resp | undefined;
};

export type RequestsFactoryItemSelectorsWithSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp
> = RequestsFactoryItemCommonSelectorsWithSerialize<
  Resp,
  Err,
  Params,
  State
> & {
  responseSelector: (state: State) => (params: Params) => TransformedResp;
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
