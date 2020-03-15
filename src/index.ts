import createReduxRequestsFactory from './create-redux-requests-factory';
import { ReduxRequestsFactory } from './types';

export * from './types';

export const {
  stateRequestsKey,
  requestsFactoryMiddleware,
  requestsFactory,
  requestsReducer,
}: ReduxRequestsFactory = createReduxRequestsFactory();

export default createReduxRequestsFactory;
