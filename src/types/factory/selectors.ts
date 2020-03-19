import { OutputSelector } from 'reselect';

import { RequestFactoryConfigWithSerialize } from './config';
import { RequestsState } from '../../types';

export type RequestsFactoryItemSelectorsWithoutSerialize<
  Resp,
  Err,
  _Params,
  State
> = {
  responseSelector: OutputSelector<
    State,
    Resp | null,
    (res: RequestsState | null) => Resp | null
  >;
  errrorSelector: OutputSelector<
    State,
    Err | null,
    (res: RequestsState | null) => Err | null
  >;
};

export type RequestsFactoryItemSelectorsWithSerialize<
  Resp,
  Err,
  Params,
  State
> = {
  responseSelector: OutputSelector<
    State,
    (params?: Params) => Resp | null,
    (res: RequestsState | null) => (params?: Params) => Resp | null
  >;
  errrorSelector: OutputSelector<
    State,
    (params?: Params) => Err | null,
    (res: RequestsState | null) => (params?: Params) => Err | null
  >;
};

export type RequestsFactoryItemSelectors<
  Resp,
  Err,
  Params,
  State,
  Config
> = Config extends RequestFactoryConfigWithSerialize<Resp, Params>
  ? RequestsFactoryItemSelectorsWithSerialize<Resp, Err, Params, State>
  : RequestsFactoryItemSelectorsWithoutSerialize<Resp, Err, Params, State>;
