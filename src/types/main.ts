import { RequestsFactory } from './factory';
import { RequestsReducer } from './reducer';
import { CreateRequestsFactoryMiddleware } from './middleware';
import { GlobalSelectors } from './selectors';
import { HydrateRequestsActionCreator } from './actions';

/** Public API returned by `createReduxRequestsFactory`. */
export type ReduxRequestsFactory<Key extends string> = {
  /** Redux state key under which this factory's reducer must be mounted. */
  stateRequestsKey: Key;
  /** Creates middleware that executes this factory's command actions. */
  createRequestsFactoryMiddleware: CreateRequestsFactoryMiddleware;
  /** Creates request-specific actions and selectors. */
  requestsFactory: RequestsFactory<Key>;
  /** Reducer that manages this factory's request state. */
  requestsReducer: RequestsReducer;
  /** Creates an action that merges a serialized requests slice into Redux. */
  hydrateRequestsAction: HydrateRequestsActionCreator<Key>;
} & GlobalSelectors<Key>;
