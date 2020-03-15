import { PreparedConfig } from '../config';
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

export type RequestsFactoryItemWithoutSerialize<
  Response,
  Error,
  Params,
  State
> = RequestsFactoryItemActions<Response, Error, Params> &
  RequestsFactoryItemSelectorsWithoutSerialize<Response, Error, Params, State>;

export type RequestsFactoryItemWithSerialize<
  Response,
  Error,
  Params,
  State
> = RequestsFactoryItemActions<Response, Error, Params> &
  RequestsFactoryItemSelectorsWithSerialize<Response, Error, Params, State>;

export type RequestsFactoryItem<
  Response,
  Error,
  Params,
  State,
  Config
> = Config extends RequestFactoryConfigWithSerialize<Response, Params>
  ? RequestsFactoryItemWithSerialize<Response, Error, Params, State>
  : RequestsFactoryItemWithoutSerialize<Response, Error, Params, State>;

export type RequestsFactory = <
  Response,
  Error,
  Params,
  State,
  Config extends RequestFactoryConfig<
    Response,
    Params
  > = RequestFactoryConfigWithoutSerialize<Response, Params>
>(
  config: Config
) => RequestsFactoryItem<Response, Error, Params, State, Config>;

export type CreateRequestsFactory = (
  preparedConfig: PreparedConfig
) => RequestsFactory;
