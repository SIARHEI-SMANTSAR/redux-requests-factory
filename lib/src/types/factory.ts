import { PreparedConfig } from './config';

export type RequestFactoryConfig<Response, Params> = {
  request: (params?: Params) => Promise<Response>;
  stateRequestKey: string;
};

export type RequestsFactoryItemActions<_Response, _Error, Params> = {
  doRequestAction: (params?: Params) => any;
};

export type RequestsFactoryItemSelectors<Response, _Error, _Params, State> = {
  responseSelector: (state: State) => Response | null;
};

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
