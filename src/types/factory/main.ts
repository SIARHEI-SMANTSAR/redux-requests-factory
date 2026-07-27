import { RootState } from '../reducer';
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

/** Factory result for optional params, one cache entry, and the original response type. */
export type RequestsFactoryItemWithOptionalParamsWithoutSerialize<
  Resp,
  Err,
  Params,
  State,
> = RequestsFactoryItemActionsWithOptionalParamsWithoutSerialize<
  Resp,
  Err,
  Params
> &
  RequestsFactoryItemSelectorsWithoutSerialize<Resp, Err, Params, State>;

/** Factory result for optional params, one cache entry, and a transformed response. */
export type RequestsFactoryItemWithOptionalParamsWithoutSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
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

/** Factory result for required params, one cache entry, and the original response type. */
export type RequestsFactoryItemWithParamsWithoutSerialize<
  Resp,
  Err,
  Params,
  State,
> = RequestsFactoryItemActionsWithParamsWithoutSerialize<Resp, Err, Params> &
  RequestsFactoryItemSelectorsWithoutSerialize<Resp, Err, Params, State>;

/** Factory result for required params, one cache entry, and a transformed response. */
export type RequestsFactoryItemWithParamsWithoutSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
> = RequestsFactoryItemActionsWithParamsWithoutSerialize<Resp, Err, Params> &
  RequestsFactoryItemSelectorsWithoutSerializeWithTransformResponse<
    Resp,
    Err,
    Params,
    State,
    TransformedResp
  >;

/** Factory result for required params cached by serialized key. */
export type RequestsFactoryItemWithParamsWithSerialize<
  Resp,
  Err,
  Params,
  State,
> = RequestsFactoryItemActionsWithParamsWithSerialize<Resp, Err, Params> &
  RequestsFactoryItemSelectorsWithSerialize<Resp, Err, Params, State>;

/** Factory result for serialized params and a transformed response. */
export type RequestsFactoryItemWithParamsWithSerializeWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
> = RequestsFactoryItemActionsWithParamsWithSerialize<Resp, Err, Params> &
  RequestsFactoryItemSelectorsWithSerializeWithTransformResponse<
    Resp,
    Err,
    Params,
    State,
    TransformedResp
  >;

/** Creates request-specific command actions, lifecycle actions, and selectors. */
export interface RequestsFactory<Key extends string> {
  /** Creates a request factory with optional params and one shared cache entry. */
  <Resp, Err, Params, State extends RootState<Key>>(
    config: RequestFactoryConfigWithOptionalParamsWithoutSerialize<
      Resp,
      Err,
      Params,
      State
    >
  ): RequestsFactoryItemWithOptionalParamsWithoutSerialize<
    Resp,
    Err,
    Params,
    State
  >;

  /** Creates a request factory with required params and one shared cache entry. */
  <Resp, Err, Params, State extends RootState<Key>>(
    config: RequestFactoryConfigWithParamsWithoutSerialize<
      Resp,
      Err,
      Params,
      State
    >
  ): RequestsFactoryItemWithParamsWithoutSerialize<Resp, Err, Params, State>;

  /** Creates an optional-param request factory with a transformed selector response. */
  <Resp, Err, Params, State extends RootState<Key>, TransformedResp = Resp>(
    config: RequestFactoryConfigWithOptionalParamsWithoutSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      State,
      TransformedResp
    >
  ): RequestsFactoryItemWithOptionalParamsWithoutSerializeWithTransformResponse<
    Resp,
    Err,
    Params,
    State,
    TransformedResp
  >;

  /** Creates a required-param request factory with a transformed selector response. */
  <Resp, Err, Params, State extends RootState<Key>, TransformedResp = Resp>(
    config: RequestFactoryConfigWithParamsWithoutSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      State,
      TransformedResp
    >
  ): RequestsFactoryItemWithParamsWithoutSerializeWithTransformResponse<
    Resp,
    Err,
    Params,
    State,
    TransformedResp
  >;

  /** Creates a request factory with a separate cache entry per serialized params key. */
  <Resp, Err, Params, State extends RootState<Key>>(
    config: RequestFactoryConfigWithParamsWithSerialize<
      Resp,
      Err,
      Params,
      State
    >
  ): RequestsFactoryItemWithParamsWithSerialize<Resp, Err, Params, State>;

  /** Creates a serialized request factory with a transformed selector response. */
  <Resp, Err, Params, State extends RootState<Key>, TransformedResp = Resp>(
    config: RequestFactoryConfigWithParamsWithSerializeWithTransformResponse<
      Resp,
      Err,
      Params,
      State,
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

/** Union of every action-and-selector result returned by `requestsFactory`. */
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
