import {
  applyMiddleware,
  combineReducers,
  legacy_createStore as createStore,
} from 'redux';

import {
  createRequestsFactoryMiddleware,
  requestsFactory,
  requestsReducer,
  stateRequestsKey,
} from '../src';

describe('Redux integration', () => {
  it('runs requests and respects cached and forced loading', async () => {
    const { middleware, toPromise } = createRequestsFactoryMiddleware();
    const firstResponse = [{ id: 1, name: 'Ada' }];
    const secondResponse = [{ id: 2, name: 'Grace' }];
    const request = jest
      .fn()
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(secondResponse);
    const {
      forcedLoadDataAction,
      isLoadingSelector,
      loadDataAction,
      responseSelector,
    } = requestsFactory({
      request,
      stateRequestKey: 'redux-users',
    });
    const reducer = combineReducers({
      [stateRequestsKey]: requestsReducer,
    });
    const store = createStore(reducer, applyMiddleware(middleware));

    store.dispatch(loadDataAction());

    expect(isLoadingSelector(store.getState())).toBe(true);

    await toPromise();

    expect(isLoadingSelector(store.getState())).toBe(false);
    expect(responseSelector(store.getState())).toBe(firstResponse);
    expect(request).toHaveBeenCalledTimes(1);

    store.dispatch(loadDataAction());
    await toPromise();

    expect(responseSelector(store.getState())).toBe(firstResponse);
    expect(request).toHaveBeenCalledTimes(1);

    store.dispatch(forcedLoadDataAction());
    await toPromise();

    expect(responseSelector(store.getState())).toBe(secondResponse);
    expect(request).toHaveBeenCalledTimes(2);
  });
});
