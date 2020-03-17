import { OutputSelector } from 'reselect';

import { RequestFactoryConfigWithSerialize } from './config';
import { RequestsState } from '../../types';

export type RequestsFactoryItemSelectorsWithoutSerialize<
  Resp,
  _Err,
  _Params,
  State
> = {
  responseSelector: OutputSelector<
    State,
    Resp | null,
    (res: RequestsState | null) => Resp | null
  >;
};

export type RequestsFactoryItemSelectorsWithSerialize<
  Resp,
  _Err,
  Params,
  State
> = {
  responseSelector: OutputSelector<
    State,
    (params?: Params) => Resp | null,
    (res: RequestsState | null) => (params?: Params) => Resp | null
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
