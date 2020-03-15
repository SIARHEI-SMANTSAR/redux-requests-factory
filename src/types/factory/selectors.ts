import { RequestFactoryConfigWithSerialize } from './config';

export type RequestsFactoryItemSelectorsWithoutSerialize<
  Response,
  _Error,
  _Params,
  State
> = {
  responseSelector: (state: State) => Response | null;
};

export type RequestsFactoryItemSelectorsWithSerialize<
  Response,
  _Error,
  Params,
  State
> = {
  responseSelector: (state: State) => (params?: Params) => Response | null;
};

export type RequestsFactoryItemSelectors<
  Response,
  Error,
  Params,
  State,
  Config
> = Config extends RequestFactoryConfigWithSerialize<Response, Params>
  ? RequestsFactoryItemSelectorsWithSerialize<Response, Error, Params, State>
  : RequestsFactoryItemSelectorsWithoutSerialize<
      Response,
      Error,
      Params,
      State
    >;
