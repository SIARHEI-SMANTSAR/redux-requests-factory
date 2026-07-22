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

    store.dispatch(loadDataAction());
    await toPromise();

    expect(responseSelector(store.getState())).toBe(response);
    expect(request).toHaveBeenCalledTimes(1);

    store.dispatch(loadDataAction());
    await toPromise();

    expect(request).toHaveBeenCalledTimes(1);

    store.dispatch(forcedLoadDataAction());
    await toPromise();

    expect(request).toHaveBeenCalledTimes(2);
  });
});
