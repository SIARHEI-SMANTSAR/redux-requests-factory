import { RequestsState } from '../reducer';
import { RequestsFactoryItemActions } from './actions';
import {
  RequestsFactoryItemSelectorsWithSerialize,
  RequestsFactoryItemSelectorsWithoutSerialize,
} from './selectors';
import {
  RequestFactoryConfigWithSerialize,
  RequestFactoryConfigWithoutSerialize,
  RequestFactoryConfig,
} from './config';

export type RootSate = {
  [key: string]: RequestsState;
};

export type RequestsFactoryItemWithoutSerialize<
  Resp,
  Err,
  Params,
  State
> = RequestsFactoryItemActions<Resp, Err, Params> &
  RequestsFactoryItemSelectorsWithoutSerialize<Resp, Err, Params, State>;

export type RequestsFactoryItemWithSerialize<
  Resp,
  Err,
  Params,
  State
> = RequestsFactoryItemActions<Resp, Err, Params> &
  RequestsFactoryItemSelectorsWithSerialize<Resp, Err, Params, State>;

export type RequestsFactoryItem<
  Resp,
  Err,
  Params,
  State,
  Config
> = Config extends RequestFactoryConfigWithSerialize<Resp, Params>
  ? RequestsFactoryItemWithSerialize<Resp, Err, Params, State>
  : RequestsFactoryItemWithoutSerialize<Resp, Err, Params, State>;

export type RequestsFactory = <
  Resp,
  Err,
  Params,
  State extends RootSate,
  Config extends RequestFactoryConfig<
    Resp,
    Params
  > = RequestFactoryConfigWithoutSerialize<Resp, Params>
>(
  config: Config
) => RequestsFactoryItem<Resp, Err, Params, State, Config>;
