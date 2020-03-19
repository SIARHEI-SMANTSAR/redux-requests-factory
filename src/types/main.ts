import { Middleware } from 'redux';

import { RequestsFactory } from './factory';
import { RequestsReducer } from './reducer';

export type ReduxRequestsFactory<Key> = {
  stateRequestsKey: Key;
  requestsFactoryMiddleware: Middleware;
  requestsFactory: RequestsFactory;
  requestsReducer: RequestsReducer;
};
