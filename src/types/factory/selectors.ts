import { OutputSelector } from 'reselect';

import { RequestFactoryConfigWithSerialize } from './config';
import { RequestsState } from '../../types';

export type RequestsFactoryItemSelectorsWithoutSerialize<
  Response,
  _Error,
  _Params,
  State
> = {
  responseSelector: OutputSelector<
    State,
    Response | null,
    (res: RequestsState | null) => Response | null
  >;
};

export type RequestsFactoryItemSelectorsWithSerialize<
  Response,
  _Error,
  Params,
  State
> = {
  responseSelector: OutputSelector<
    State,
    (params?: Params) => Response | null,
    (res: RequestsState | null) => (params?: Params) => Response | null
  >;
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
