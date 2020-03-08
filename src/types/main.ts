import { Middleware } from 'redux';

import { RequestsFactory } from './factory';
import { RequestsReducer } from './reducer';

export type ReduxRequestsFactory = {
  stateRequestsKey: string;
  requestsFactoryMiddleware: Middleware;
  requestsFactory: RequestsFactory;
  requestsReducer: RequestsReducer;
};
