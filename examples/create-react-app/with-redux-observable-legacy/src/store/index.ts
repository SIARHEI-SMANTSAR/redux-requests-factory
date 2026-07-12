import { createStore, applyMiddleware, combineReducers } from 'redux';
import { createLogger } from 'redux-logger';
import {
  stateRequestsKey,
  requestsReducer,
  createRequestsFactoryMiddleware,
} from 'redux-requests-factory';
import { createEpicMiddleware } from 'redux-observable';

import rootEpic from './rootEpic';

export const reducer = combineReducers({
  [stateRequestsKey]: requestsReducer,
});

const logger = createLogger({ collapsed: true });
const { middleware } = createRequestsFactoryMiddleware();
const epicMiddleware = createEpicMiddleware();

const reduxMiddleware = applyMiddleware(middleware, epicMiddleware, logger);

const store = createStore(reducer, reduxMiddleware);

epicMiddleware.run(rootEpic);

export default store;
