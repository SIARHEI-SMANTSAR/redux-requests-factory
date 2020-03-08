import {
  CreateRequestsFactory,
  RequestsFactoryItem,
  RequestFactoryConfig,
} from '../types';
import createActions from './create-actions';
import createSelectors from './create-selectors';

export const createRequestsFactory: CreateRequestsFactory = preparedConfig => <
  Response,
  Error,
  Params,
  State
>(
  config: RequestFactoryConfig<Response, Params>
): RequestsFactoryItem<Response, Error, Params, State> => {
  return {
    ...createActions<Response, Error, Params, State>(preparedConfig, config),
    ...createSelectors<Response, Error, Params, State>(preparedConfig, config),
  };
};
