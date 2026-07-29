import {
  applyMiddleware,
  combineReducers,
  legacy_createStore as createStore,
} from 'redux';
import {
  createRequestsFactoryMiddleware,
  RequestsStatuses,
  requestsReducer,
  stateRequestsKey,
  type RequestsFactoryDispatch,
} from 'redux-requests-factory';

const rootReducer = combineReducers({
  [stateRequestsKey]: requestsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = (preloadedState?: RootState) => {
  const { cancelAllRequests, middleware, toPromise } =
    createRequestsFactoryMiddleware({
      loadDataRetryStatuses: [],
      loadDataHydratedRetryStatuses: [
        RequestsStatuses.Failed,
        RequestsStatuses.Canceled,
      ],
    });
  const store = createStore(
    rootReducer,
    preloadedState,
    applyMiddleware(middleware)
  );

  return Object.assign(store, {
    asyncRequests: toPromise,
    cancelAsyncRequests: cancelAllRequests,
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = RequestsFactoryDispatch & AppStore['dispatch'];
