import createReduxRequestsFactory from './create-redux-requests-factory';
import { ReduxRequestsFactory } from './types';
import { DEFAULT_STATE_REQUESTS_KEY } from './constants';

export * from './types';

export const {
  stateRequestsKey,
  createRequestsFactoryMiddleware,
  requestsFactory,
  requestsReducer,
}: ReduxRequestsFactory<typeof DEFAULT_STATE_REQUESTS_KEY> = createReduxRequestsFactory();

export default createReduxRequestsFactory;
