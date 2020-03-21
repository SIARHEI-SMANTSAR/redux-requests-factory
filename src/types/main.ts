import { RequestsFactory } from './factory';
import { RequestsReducer } from './reducer';
import { CreateRequestsFactoryMiddleware } from './middleware';

export type ReduxRequestsFactory<Key> = {
  stateRequestsKey: Key;
  createRequestsFactoryMiddleware: CreateRequestsFactoryMiddleware;
  requestsFactory: RequestsFactory;
  requestsReducer: RequestsReducer;
};
