import {
  PreparedConfig,
  RequestFactoryConfig,
  RequestFactoryConfigWithoutSerialize,
  RequestsFactoryItem,
  RequestsFactory,
} from '../types';
import createActions from './create-actions';
import createSelectors from './create-selectors';

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
  return {
    ...createActions<Response, Error, Params, State>(preparedConfig, config),
    ...createSelectors<Response, Error, Params, State, Config>(
      preparedConfig,
      config
    ),
  } as RequestsFactoryItem<Response, Error, Params, State, Config>;
};
