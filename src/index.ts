import createReduxRequestsFactory from './create-redux-requests-factory';

export * from './types';

export const {
  stateRequestsKey,
  requestsFactoryMiddleware,
  requestsFactory,
  requestsReducer,
} = createReduxRequestsFactory();

export default createReduxRequestsFactory;
