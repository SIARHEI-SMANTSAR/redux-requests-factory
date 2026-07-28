import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  createRequestsFactoryMiddleware,
  requestsReducer,
  stateRequestsKey,
} from 'redux-requests-factory';

import counterReducer from '@/lib/features/counter/counter-slice';
import { loggerMiddleware } from '@/lib/logger-middleware';

const rootReducer = combineReducers({
  counter: counterReducer,
  [stateRequestsKey]: requestsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = (preloadedState?: RootState) => {
  const { middleware: requestsFactoryMiddleware, toPromise } =
    createRequestsFactoryMiddleware();

  return Object.assign(
    configureStore({
      reducer: rootReducer,
      preloadedState,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
          .prepend(requestsFactoryMiddleware)
          .concat(loggerMiddleware),
    }),
    { asyncRequests: toPromise }
  );
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
