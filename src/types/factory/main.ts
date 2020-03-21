import {
  RequestsFactoryItemActionsWithOptionalParamsWithoutSerialize,
  RequestsFactoryItemActionsWithParamsWithoutSerialize,
  RequestsFactoryItemActionsWithParamsWithSerialize,
} from './actions';
import {
  RequestsFactoryItemSelectorsWithoutSerialize,
  RequestsFactoryItemSelectorsWithSerialize,
} from './selectors';
import {
  RequestFactoryConfigWithOptionalParamsWithoutSerialize,
  RequestFactoryConfigWithParamsWithoutSerialize,
  RequestFactoryConfigWithParamsWithSerialize,
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

export type RequestsFactoryItemWithParamsWithoutSerialize<
  Resp,
  Err,
  Params,
  State
> = RequestsFactoryItemActionsWithParamsWithoutSerialize<Resp, Err, Params> &
  RequestsFactoryItemSelectorsWithoutSerialize<Resp, Err, Params, State>;

export type RequestsFactoryItemWithParamsWithSerialize<
  Resp,
  Err,
  Params,
  State
> = RequestsFactoryItemActionsWithParamsWithSerialize<Resp, Err, Params> &
  RequestsFactoryItemSelectorsWithSerialize<Resp, Err, Params, State>;

export interface RequestsFactory {
  <Resp, Err, Params, State>(
    config: RequestFactoryConfigWithOptionalParamsWithoutSerialize<Resp, Params>
  ): RequestsFactoryItemWithOptionalParamsWithoutSerialize<
    Resp,
    Err,
    Params,
    State
  >;

  <Resp, Err, Params, State>(
    config: RequestFactoryConfigWithParamsWithoutSerialize<Resp, Params>
  ): RequestsFactoryItemWithParamsWithoutSerialize<Resp, Err, Params, State>;

  <Resp, Err, Params, State>(
    config: RequestFactoryConfigWithParamsWithSerialize<Resp, Params>
  ): RequestsFactoryItemWithParamsWithSerialize<Resp, Err, Params, State>;
}

export type RequestsFactoryItem<Resp, Err, Params, State> =
  | RequestsFactoryItemWithOptionalParamsWithoutSerialize<
      Resp,
      Err,
      Params,
      State
    >
  | RequestsFactoryItemWithParamsWithoutSerialize<Resp, Err, Params, State>
  | RequestsFactoryItemWithParamsWithSerialize<Resp, Err, Params, State>;
