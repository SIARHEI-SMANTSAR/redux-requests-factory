import { CreateConfig, ReduxRequestsFactory } from './types';
import { getCreateRequestsFactoryMiddleware } from './middleware';
import prepareConfig from './prepare-config';
import { createRequestsFactory } from './factory';
import { createRequestsReducer } from './reducer';
import { DEFAULT_STATE_REQUESTS_KEY } from './constants';
import createGlobalSelectors from './selectors';
import { createHydrateRequestsAction } from './actions';

const createReduxRequestsFactory = <
  Key extends string = typeof DEFAULT_STATE_REQUESTS_KEY,
>(
  config?: CreateConfig<Key>
): ReduxRequestsFactory<Key> => {
  const preparedConfig = prepareConfig<Key>(config);

  return {
    stateRequestsKey: preparedConfig.stateRequestsKey,
    createRequestsFactoryMiddleware:
      getCreateRequestsFactoryMiddleware<Key>(preparedConfig),
    requestsFactory: createRequestsFactory<Key>(preparedConfig),
    requestsReducer: createRequestsReducer<Key>(preparedConfig),
    hydrateRequestsAction: createHydrateRequestsAction<Key>(preparedConfig),
    ...createGlobalSelectors<Key>(preparedConfig),
  };
};

export default createReduxRequestsFactory;
