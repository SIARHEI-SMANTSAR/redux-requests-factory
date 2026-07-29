import {
  applyMiddleware,
  combineReducers,
  legacy_createStore as createStore,
} from 'redux';
import { createLogger } from 'redux-logger';
import {
  createRequestsFactoryMiddleware,
  requestsReducer,
  type RequestsFactoryDispatch,
  stateRequestsKey,
} from 'redux-requests-factory';

const { middleware: requestsFactoryMiddleware } =
  createRequestsFactoryMiddleware({
    loadDataRetryStatuses: [],
  });
const loggerMiddleware = createLogger({ collapsed: true });

const rootReducer = combineReducers({
  [stateRequestsKey]: requestsReducer,
});

export const store = createStore(
  rootReducer,
  applyMiddleware(requestsFactoryMiddleware, loggerMiddleware)
);

export type AppStore = typeof store;
export type AppDispatch = RequestsFactoryDispatch & AppStore['dispatch'];
export type RootState = ReturnType<AppStore['getState']>;
