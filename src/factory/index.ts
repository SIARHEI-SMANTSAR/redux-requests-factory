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
): RequestsFactoryItem<Response, Error, Params, State, Config> => {
  const patchedConfig = patchConfig<Response, Params, Config>(config);

  return {
    ...createActions<Response, Error, Params, State>(
      preparedConfig,
      patchedConfig
    ),
    ...createSelectors<Response, Error, Params, State, Config>(
      preparedConfig,
      patchedConfig
    ),
  } as RequestsFactoryItem<Response, Error, Params, State, Config>;
};
