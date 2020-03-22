import {
  createStore,
  applyMiddleware,
  combineReducers,
  Store,
  AnyAction,
} from 'redux';
import { createLogger } from 'redux-logger';
import { MakeStore } from 'next-redux-wrapper';
import {
  stateRequestsKey,
  requestsReducer,
  createRequestsFactoryMiddleware,
  Actions as FactoryActions,
} from 'redux-requests-factory';

const reducer = combineReducers({
  [stateRequestsKey]: requestsReducer,
});

export type RootState = ReturnType<typeof reducer>;

type Actions = AnyAction | FactoryActions;

export type StoreWithAsyncRequests = Store<RootState, Actions> & {
  asyncRequests: () => Promise<void>;
};

const makeStore: MakeStore = (
  initialState: RootState,
  { isServer }
): StoreWithAsyncRequests => {
  const logger = createLogger({ collapsed: true });
  const { middleware, toPromise } = createRequestsFactoryMiddleware({
    isServer,
  });
  const reduxMiddleware = applyMiddleware(logger, middleware);

  const store = createStore(reducer, initialState, reduxMiddleware);

  // @ts-ignore
  store.asyncRequests = toPromise;

  return store as StoreWithAsyncRequests;
};

export default makeStore;
