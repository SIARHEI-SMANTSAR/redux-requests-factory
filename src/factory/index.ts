import {
  PreparedConfig,
  RequestFactoryConfig,
  RequestFactoryConfigWithoutSerialize,
  RequestsFactoryItem,
  RequestsFactory,
} from '../types';
import createActions from './create-actions';
import createSelectors from './create-selectors';
import { patchConfig } from './helpers';

export const createRequestsFactory = (
  preparedConfig: PreparedConfig
): RequestsFactory => <
  Resp,
  Err,
  Params,
  State,
  Config extends RequestFactoryConfig<
    Resp,
    Params
  > = RequestFactoryConfigWithoutSerialize<Resp, Params>
>(
  config: Config
): RequestsFactoryItem<Resp, Err, Params, State, Config> => {
  const patchedConfig = patchConfig<Resp, Params, Config>(config);

  return {
    ...createActions<Resp, Err, Params, State>(preparedConfig, patchedConfig),
    ...createSelectors<Resp, Err, Params, State, Config>(
      preparedConfig,
      patchedConfig
    ),
  } as RequestsFactoryItem<Resp, Err, Params, State, Config>;
};
