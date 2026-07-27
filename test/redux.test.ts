import {
  applyMiddleware,
  combineReducers,
  legacy_createStore as createStore,
  type UnknownAction,
} from 'redux';

import {
  createRequestsFactoryMiddleware,
  requestsFactory,
  requestsReducer,
  stateRequestsKey,
} from '../src';

describe('Redux integration', () => {
  it.each([
    ['by default', undefined, undefined, 1],
    [
      'when middleware forwarding is disabled',
      { forwardFactoryActions: false },
      undefined,
      0,
    ],
    [
      'when enabled for one action',
      { forwardFactoryActions: false },
      { forwardFactoryAction: true },
      1,
    ],
    [
      'when disabled for one action',
      { forwardFactoryActions: true },
      { forwardFactoryAction: false },
      0,
    ],
  ] as const)(
    'forwards factory actions to reducers %s',
    async (_, middlewareConfig, actionOptions, expectedFactoryActionCount) => {
      const { middleware } = createRequestsFactoryMiddleware(middlewareConfig);
      const response = { id: 1 };
      const { loadDataAction, responseSelector } = requestsFactory({
        request: jest.fn().mockResolvedValue(response),
        stateRequestKey: 'forwarding-users',
      });
      const factoryActionType = loadDataAction.type;
      const factoryActionCountReducer = (state = 0, action: UnknownAction) =>
        action.type === factoryActionType ? state + 1 : state;
      const reducer = combineReducers({
        [stateRequestsKey]: requestsReducer,
        factoryActionCount: factoryActionCountReducer,
      });
      const store = createStore(reducer, applyMiddleware(middleware));

      await store.dispatch(loadDataAction(undefined, actionOptions));

      expect(store.getState().factoryActionCount).toBe(
        expectedFactoryActionCount
      );
      expect(responseSelector(store.getState())).toBe(response);
    }
  );

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

    const loadPromise = store.dispatch(loadDataAction());
    const duplicateLoadPromise = store.dispatch(loadDataAction());

    expect(isLoadingSelector(store.getState())).toBe(true);
    expect(duplicateLoadPromise).toBe(loadPromise);

    await loadPromise;

    expect(isLoadingSelector(store.getState())).toBe(false);
    expect(responseSelector(store.getState())).toBe(firstResponse);
    expect(request).toHaveBeenCalledTimes(1);

    const cachedLoadPromise = store.dispatch(loadDataAction());

    expect(cachedLoadPromise).not.toBe(loadPromise);

    await cachedLoadPromise;

    expect(responseSelector(store.getState())).toBe(firstResponse);
    expect(request).toHaveBeenCalledTimes(1);

    const forcedLoadPromise = store.dispatch(forcedLoadDataAction());
    const loadDuringForcedPromise = store.dispatch(loadDataAction());

    expect(loadDuringForcedPromise).toBe(forcedLoadPromise);

    await forcedLoadPromise;

    expect(responseSelector(store.getState())).toBe(secondResponse);
    expect(request).toHaveBeenCalledTimes(2);

    await toPromise();
  });

  it('lets dispatch await one request without waiting for other requests', async () => {
    let resolveUsers!: (response: string) => void;
    let resolvePosts!: (response: string) => void;
    const usersRequest = jest.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveUsers = resolve;
        })
    );
    const postsRequest = jest.fn(
      () =>
        new Promise<string>((resolve) => {
          resolvePosts = resolve;
        })
    );
    const { middleware } = createRequestsFactoryMiddleware();
    const users = requestsFactory({
      request: usersRequest,
      stateRequestKey: 'dispatch-users',
    });
    const posts = requestsFactory({
      request: postsRequest,
      stateRequestKey: 'dispatch-posts',
    });
    const reducer = combineReducers({
      [stateRequestsKey]: requestsReducer,
    });
    const store = createStore(reducer, applyMiddleware(middleware));

    const usersPromise = store.dispatch(users.loadDataAction());
    const postsPromise = store.dispatch(posts.loadDataAction());

    resolveUsers('users');
    await usersPromise;

    expect(users.responseSelector(store.getState())).toBe('users');
    expect(users.isLoadingSelector(store.getState())).toBe(false);
    expect(posts.isLoadingSelector(store.getState())).toBe(true);

    resolvePosts('posts');
    await postsPromise;
  });
});
