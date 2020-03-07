import { createStore, applyMiddleware, combineReducers } from "redux";
import { createLogger } from "redux-logger";
import {
  stateRequestsKey,
  requestsReducer,
  requestsFactoryMiddleware
} from "redux-requests-factory";

const reducer = combineReducers({
  [stateRequestsKey]: requestsReducer
});

const logger = createLogger({ collapsed: true });
const reduxMiddleware = applyMiddleware(logger, requestsFactoryMiddleware);

const store = createStore(reducer, reduxMiddleware);

export default store;
