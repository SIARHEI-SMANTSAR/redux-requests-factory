import { Config, ReduxRequestsFactory } from './types';
import { createRequestsFactoryMiddleware } from './middleware';
import prepareConfig from './prepare-config';
import { createRequestsFactory } from './factory';
import { createRequestsReducer } from './reducer';

const createReduxRequestsFactory = (config?: Config): ReduxRequestsFactory => {
  const preparedConfig = prepareConfig(config);

  return {
    stateRequestsKey: preparedConfig.stateRequestsKey,
    requestsFactoryMiddleware: createRequestsFactoryMiddleware(preparedConfig),
    requestsFactory: createRequestsFactory(preparedConfig),
    requestsReducer: createRequestsReducer(preparedConfig),
  };
};

export default createReduxRequestsFactory;
