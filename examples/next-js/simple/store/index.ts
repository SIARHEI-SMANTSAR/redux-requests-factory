import { createStore, applyMiddleware, combineReducers } from 'redux';
import { createLogger } from 'redux-logger';
import { MakeStore } from 'next-redux-wrapper';
import {
  stateRequestsKey,
  requestsReducer,
  requestsFactoryMiddleware,
} from 'redux-requests-factory';

const reducer = combineReducers({
  [stateRequestsKey]: requestsReducer,
});

export type RootState = ReturnType<typeof reducer>;

// @ts-ignore
const makeStore: MakeStore = (initialState: RootState) => {
  const logger = createLogger({ collapsed: true });
  const reduxMiddleware = applyMiddleware(logger, requestsFactoryMiddleware);

  const store = createStore(reducer, initialState, reduxMiddleware);

  // @ts-ignore
  store.requests = requestsFactoryMiddleware.toPromise;

  return store;
};

export default makeStore;
