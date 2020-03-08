import { PreparedConfig } from '../config';
import { RequestsFactoryItemActions } from './actions';
import { RequestsFactoryItemSelectors } from './selectors';
import { RequestFactoryConfig } from './config';

export type RequestsFactoryItem<
  Response,
  Error,
  Params,
  State
> = RequestsFactoryItemActions<Response, Error, Params> &
  RequestsFactoryItemSelectors<Response, Error, Params, State>;

export type RequestsFactory = <
  Response = any,
  Error = any,
  Params = any,
  State = any
>(
  config: RequestFactoryConfig<Response, Params>
) => RequestsFactoryItem<Response, Error, Params, State>;

export type CreateRequestsFactory = (
  preparedConfig: PreparedConfig
) => RequestsFactory;
