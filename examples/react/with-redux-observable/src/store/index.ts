import {
  legacy_createStore as createStore,
  applyMiddleware,
  combineReducers,
} from 'redux';
import { createLogger } from 'redux-logger';
import { createEpicMiddleware } from 'redux-observable';
import {
  stateRequestsKey,
  requestsReducer,
  createRequestsFactoryMiddleware,
} from 'redux-requests-factory';

import rootEpic from './rootEpic';

export const reducer = combineReducers({
  [stateRequestsKey]: requestsReducer,
});

type RootState = ReturnType<typeof reducer>;

const logger = createLogger({ collapsed: true });
const { middleware } = createRequestsFactoryMiddleware();
const epicMiddleware = createEpicMiddleware<any, any, RootState>();
const reduxMiddleware = applyMiddleware(middleware, epicMiddleware, logger);

const store = createStore(reducer, undefined, reduxMiddleware);

epicMiddleware.run(rootEpic);

export default store;
