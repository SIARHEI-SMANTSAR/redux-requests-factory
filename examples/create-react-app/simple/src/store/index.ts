import { createStore, applyMiddleware, combineReducers } from 'redux';
import { createLogger } from 'redux-logger';

const reducer = combineReducers({
  api: (a = {}) => a,
});

const logger = createLogger({ collapsed: true }); // log every action to see what's happening behind the scenes.
const reduxMiddleware = applyMiddleware(logger);

const store = createStore(reducer, reduxMiddleware);

export default store;
