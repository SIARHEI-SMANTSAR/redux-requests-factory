import {
  PreparedConfig,
  RequestFactoryConfig,
  RequestFactoryConfigWithoutSerialize,
  RequestsFactoryItem,
  RequestsFactory,
  RootSate,
} from '../types';
import createActions from './create-actions';
import createSelectors from './create-selectors';
import { patchConfig } from './helpers';

export const createRequestsFactory = <Key extends string>(
  preparedConfig: PreparedConfig<Key>
): RequestsFactory => <
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
): RequestsFactoryItem<Resp, Err, Params, State, Config> => {
  const patchedConfig = patchConfig<Resp, Params, Config>(config);

  return {
    ...createActions<Resp, Err, Params, State, Key>(
      preparedConfig,
      patchedConfig
    ),
    ...createSelectors<Resp, Err, Params, State, Config, Key>(
      preparedConfig,
      patchedConfig
    ),
  } as RequestsFactoryItem<Resp, Err, Params, State, Config>;
};
