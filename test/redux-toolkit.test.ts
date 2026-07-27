import { configureStore } from '@reduxjs/toolkit';

import {
  createRequestsFactoryMiddleware,
  requestsFactory,
  requestsReducer,
  stateRequestsKey,
} from '../src';

describe('Redux Toolkit integration', () => {
  it('supports configureStore without type adapters', async () => {
    const { middleware, toPromise } = createRequestsFactoryMiddleware();
    const response = [{ id: 1, name: 'Ada' }];
    const request = jest.fn().mockResolvedValue(response);
    const { forcedLoadDataAction, loadDataAction, responseSelector } =
      requestsFactory({
        request,
        stateRequestKey: 'toolkit-users',
      });

    const store = configureStore({
      reducer: {
        [stateRequestsKey]: requestsReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(middleware),
    });

    const plainAction = { type: 'PLAIN_ACTION' };
    expect(store.dispatch(plainAction)).toBe(plainAction);

    const loadPromise: Promise<void> = store.dispatch(loadDataAction());
    const duplicateLoadPromise: Promise<void> =
      store.dispatch(loadDataAction());

    expect(duplicateLoadPromise).toBe(loadPromise);

    await loadPromise;

    expect(responseSelector(store.getState())).toBe(response);
    expect(request).toHaveBeenCalledTimes(1);

    await store.dispatch(loadDataAction());

    expect(request).toHaveBeenCalledTimes(1);

    await store.dispatch(forcedLoadDataAction());

    expect(request).toHaveBeenCalledTimes(2);

    await toPromise();
  });
});
