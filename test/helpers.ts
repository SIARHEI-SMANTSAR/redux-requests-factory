import {
  applyMiddleware,
  combineReducers,
  legacy_createStore as createStore,
  type Middleware,
  type UnknownAction,
} from 'redux';

import {
  createRequestsFactoryMiddleware,
  requestsReducer,
  type RequestsFactoryDispatch,
  stateRequestsKey,
} from '../src';

export type Deferred<Value> = {
  promise: Promise<Value>;
  reject: (reason?: unknown) => void;
  resolve: (value: Value) => void;
};

export const createDeferred = <Value>(): Deferred<Value> => {
  let resolve!: (value: Value) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<Value>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
};

export const createRequestsTestStore = () => {
  const recordedActions: UnknownAction[] = [];
  const recorderMiddleware: Middleware = () => (next) => (action) => {
    if (typeof action === 'object' && action !== null && 'type' in action) {
      recordedActions.push(action as UnknownAction);
    }

    return next(action);
  };
  const { cancelAllRequests, middleware, toPromise } =
    createRequestsFactoryMiddleware();
  const reducer = combineReducers({
    [stateRequestsKey]: requestsReducer,
  });
  const store = createStore(
    reducer,
    applyMiddleware(middleware, recorderMiddleware)
  );
  const typedStore = store as Omit<typeof store, 'dispatch'> & {
    dispatch: RequestsFactoryDispatch & typeof store.dispatch;
  };

  return { cancelAllRequests, recordedActions, store: typedStore, toPromise };
};
