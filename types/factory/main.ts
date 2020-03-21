import { RootSate } from '../reducer';
import {
  RequestsFactoryItemActionsWithOptionalParamsWithoutSerialize,
  RequestsFactoryItemActionsWithParamsWithoutSerialize,
  RequestsFactoryItemActionsWithParamsWithSerialize,
} from './actions';
import {
  RequestsFactoryItemSelectorsWithoutSerialize,
  RequestsFactoryItemSelectorsWithSerialize,
  RequestsFactoryItemSelectorsWithSerializeWithTransformResponse,
  RequestsFactoryItemSelectorsWithoutSerializeWithTransformResponse,
} from './selectors';
import {
  RequestFactoryConfigWithOptionalParamsWithoutSerialize,
  RequestFactoryConfigWithParamsWithoutSerialize,
  RequestFactoryConfigWithParamsWithSerialize,
  RequestFactoryConfigWithOptionalParamsWithoutSerializeWithTransformResponse,
  RequestFactoryConfigWithParamsWithoutSerializeWithTransformResponse,
  RequestFactoryConfigWithParamsWithSerializeWithTransformResponse,
} from './config';

export type RequestsFactoryItemWithOptionalParamsWithoutSerialize<
  Resp,
  Err,
  Params,
  State
> = RequestsFactoryItemActionsWithOptionalParamsWithoutSerialize<
  Resp,
  Err,
  Params
> &
  RequestsFactoryItemSelectorsWithoutSerialize<Resp, Err, Params, State>;

export type RequestsFactoryItemWithOptionalParamsWithoutSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp
> = RequestsFactoryItemActionsWithOptionalParamsWithoutSerialize<
  Resp,
  Err,
  Params
> &
  RequestsFactoryItemSelectorsWithoutSerializeWithTransformResponse<
    Resp,
    Err,
    Params,
    State,
    TransformedResp
  >;

export type RequestsFactoryItemWithParamsWithoutSerialize<
  Resp,
  Err,
  Params,
  State
> = RequestsFactoryItemActionsWithParamsWithoutSerialize<Resp, Err, Params> &
  RequestsFactoryItemSelectorsWithoutSerialize<Resp, Err, Params, State>;

export type RequestsFactoryItemWithParamsWithoutSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp
> = RequestsFactoryItemActionsWithParamsWithoutSerialize<Resp, Err, Params> &
  RequestsFactoryItemSelectorsWithoutSerializeWithTransformResponse<
    Resp,
    Err,
    Params,
    State,
    TransformedResp
  >;

export type RequestsFactoryItemWithParamsWithSerialize<
  Resp,
  Err,
  Params,
  State
> = RequestsFactoryItemActionsWithParamsWithSerialize<Resp, Err, Params> &
  RequestsFactoryItemSelectorsWithSerialize<Resp, Err, Params, State>;

export type RequestsFactoryItemWithParamsWithSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp
> = RequestsFactoryItemActionsWithParamsWithSerialize<Resp, Err, Params> &
  RequestsFactoryItemSelectorsWithSerializeWithTransformResponse<
    Resp,
    Err,
    Params,
    State,
    TransformedResp
  >;

export interface RequestsFactory<Key extends string> {
  <Resp, Err, Params, State extends RootSate<Key>>(
    config: RequestFactoryConfigWithOptionalParamsWithoutSerialize<
      Resp,
      Err,
      Params
    >
  ): RequestsFactoryItemWithOptionalParamsWithoutSerialize<
    Resp,
    Err,
    Params,
    State
  >;

  <Resp, Err, Params, State extends RootSate<Key>, TransformedResp = Resp>(
    config: RequestFactoryConfigWithOptionalParamsWithoutSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      TransformedResp
    >
  ): RequestsFactoryItemWithOptionalParamsWithoutSerializeWithTransformResponse<
    Resp,
    Err,
    Params,
    State,
    TransformedResp
  >;

  <Resp, Err, Params, State extends RootSate<Key>>(
    config: RequestFactoryConfigWithParamsWithoutSerialize<Resp, Err, Params>
  ): RequestsFactoryItemWithParamsWithoutSerialize<Resp, Err, Params, State>;

  <Resp, Err, Params, State extends RootSate<Key>, TransformedResp = Resp>(
    config: RequestFactoryConfigWithParamsWithoutSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      TransformedResp
    >
  ): RequestsFactoryItemWithParamsWithoutSerializeWithTransformResponse<
    Resp,
    Err,
    Params,
    State,
    TransformedResp
  >;

  <Resp, Err, Params, State extends RootSate<Key>>(
    config: RequestFactoryConfigWithParamsWithSerialize<Resp, Err, Params>
  ): RequestsFactoryItemWithParamsWithSerialize<Resp, Err, Params, State>;

  <Resp, Err, Params, State extends RootSate<Key>, TransformedResp = Resp>(
    config: RequestFactoryConfigWithParamsWithSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      TransformedResp
    >
  ): RequestsFactoryItemWithParamsWithSerializeWithTransformResponse<
    Resp,
    Err,
    Params,
    State,
    TransformedResp
  >;
}

export type RequestsFactoryItem<Resp, Err, Params, State, TransformedResp> =
  | RequestsFactoryItemWithOptionalParamsWithoutSerialize<
      Resp,
      Err,
      Params,
      State
    >
  | RequestsFactoryItemWithOptionalParamsWithoutSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      State,
      TransformedResp
    >
  | RequestsFactoryItemWithParamsWithoutSerialize<Resp, Err, Params, State>
  | RequestsFactoryItemWithParamsWithoutSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      State,
      TransformedResp
    >
  | RequestsFactoryItemWithParamsWithSerialize<Resp, Err, Params, State>
  | RequestsFactoryItemWithParamsWithSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      State,
      TransformedResp
    >;
