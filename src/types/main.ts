import { RequestsFactory } from './factory';
import { RequestsReducer } from './reducer';
import { CreateRequestsFactoryMiddleware } from './middleware';
import { GlobalSelectors } from './selectors';
import { HydrateRequestsActionCreator } from './actions';

export type ReduxRequestsFactory<Key extends string> = {
  stateRequestsKey: Key;
  createRequestsFactoryMiddleware: CreateRequestsFactoryMiddleware;
  requestsFactory: RequestsFactory<Key>;
  requestsReducer: RequestsReducer;
  hydrateRequestsAction: HydrateRequestsActionCreator<Key>;
} & GlobalSelectors<Key>;
