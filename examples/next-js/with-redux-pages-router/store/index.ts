import {
  applyMiddleware,
  combineReducers,
  legacy_createStore as createStore,
  type AnyAction,
  type Store,
} from "redux";
import {
  createWrapper,
  HYDRATE,
  type Context,
} from "next-redux-wrapper";
import {
  type Actions as FactoryActions,
  createRequestsFactoryMiddleware,
  requestsReducer,
  stateRequestsKey,
} from "redux-requests-factory";

const combinedReducer = combineReducers({
  [stateRequestsKey]: requestsReducer,
});

export type RootState = ReturnType<typeof combinedReducer>;
type AppAction = AnyAction | FactoryActions;

export type StoreWithAsyncRequests = Store<RootState, AppAction> & {
  asyncRequests: () => Promise<void>;
};

const reducer = (state: RootState | undefined, action: AnyAction) => {
  if (action.type === HYDRATE) {
    return {
      ...state,
      ...action.payload,
      [stateRequestsKey]: {
        ...state?.[stateRequestsKey],
        ...action.payload[stateRequestsKey],
      },
    };
  }

  return combinedReducer(state, action as Parameters<typeof combinedReducer>[1]);
};

const makeStore = (_context: Context): StoreWithAsyncRequests => {
  const { middleware, toPromise } = createRequestsFactoryMiddleware();
  const store = createStore(
    reducer,
    undefined,
    applyMiddleware(middleware)
  ) as StoreWithAsyncRequests;

  store.asyncRequests = toPromise;

  return store;
};

export const wrapper = createWrapper<StoreWithAsyncRequests>(makeStore, {
  serializeState: (state) => JSON.parse(JSON.stringify(state)) as RootState,
});
