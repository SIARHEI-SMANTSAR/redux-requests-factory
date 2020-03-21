import { Middleware } from 'redux';

import { RequestsFactory } from './factory';
import { RequestsReducer } from './reducer';

export type ReduxRequestsFactory<Key> = {
  stateRequestsKey: Key;
  requestsFactoryMiddleware: Middleware & { toPromise: () => Promise<void> };
  requestsFactory: RequestsFactory;
  requestsReducer: RequestsReducer;
};
