import {
  legacy_createStore as createStore,
  applyMiddleware,
  combineReducers,
} from 'redux';
import { createLogger } from 'redux-logger';
import {
  stateRequestsKey,
  requestsReducer,
  createRequestsFactoryMiddleware,
} from 'redux-requests-factory';

export const reducer = combineReducers({
  [stateRequestsKey]: requestsReducer,
});

const logger = createLogger({ collapsed: true });
const { middleware } = createRequestsFactoryMiddleware();
const reduxMiddleware = applyMiddleware(middleware, logger);

const store = createStore(reducer, undefined, reduxMiddleware);

export default store;
