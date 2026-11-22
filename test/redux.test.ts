import {
  applyMiddleware,
  combineReducers,
  legacy_createStore as createStore,
  type UnknownAction,
} from 'redux';

import createReduxRequestsFactory, {
  createRequestsFactoryMiddleware,
  requestsFactory,
  requestsReducer,
  stateRequestsKey,
} from '../src';
import { createDeferred } from './helpers';

describe('Redux integration', () => {
  it('routes commands, responses and global loading to their own factory', async () => {
    const first = createReduxRequestsFactory({ stateRequestsKey: 'first' });
    const second = createReduxRequestsFactory({ stateRequestsKey: 'second' });
    const firstRuntime = first.createRequestsFactoryMiddleware({
      globalLoadingEnabled: false,
    });
    const secondRuntime = second.createRequestsFactoryMiddleware();
    const request = createDeferred<string>();
    const firstApi = first.requestsFactory({
      stateRequestKey: 'shared',
      request: async () => 'response A',
    });
    const secondApi = second.requestsFactory({
      stateRequestKey: 'shared',
      request: () => request.promise,
    });
    const store = createStore(
      combineReducers({
        first: first.requestsReducer,
        second: second.requestsReducer,
      }),
      applyMiddleware(firstRuntime.middleware, secondRuntime.middleware)
    );

    const secondPromise = store.dispatch(secondApi.loadDataAction());
    expect(first.isSomethingLoadingSelector(store.getState())).toBe(false);
    expect(second.isSomethingLoadingSelector(store.getState())).toBe(true);
    await firstRuntime.cancelAllRequests();
    request.resolve('response B');
    await secondPromise;

    expect(firstApi.responseSelector(store.getState())).toBeUndefined();
    expect(secondApi.responseSelector(store.getState())).toBe('response B');
    await store.dispatch(firstApi.loadDataAction());
    expect(firstApi.responseSelector(store.getState())).toBe('response A');
    expect(secondApi.responseSelector(store.getState())).toBe('response B');
  });

  it('isolates fulfilled and rejected subscriptions for matching request keys', async () => {
    const first = createReduxRequestsFactory({ stateRequestsKey: 'first' });
    const second = createReduxRequestsFactory({ stateRequestsKey: 'second' });
    const firstApi = first.requestsFactory({
      stateRequestKey: 'shared',
      request: async () => 'response A',
    });
    const secondApi = second.requestsFactory({
      stateRequestKey: 'shared',
      request: jest
        .fn()
        .mockResolvedValueOnce('response B')
        .mockRejectedValueOnce(new Error('second request failed')),
    });
    const firstTypes = [
      firstApi.requestFulfilledAction.type,
      firstApi.requestRejectedAction.type,
    ];
    const secondTypes = [
      secondApi.requestFulfilledAction.type,
      secondApi.requestRejectedAction.type,
    ];
    const record =
      (types: string[]) =>
      (state: string[] = [], action: UnknownAction) =>
        types.includes(action.type) ? [...state, action.type] : state;
    const store = createStore(
      combineReducers({
        first: first.requestsReducer,
        second: second.requestsReducer,
        firstEvents: record(firstTypes),
        secondEvents: record(secondTypes),
      }),
      applyMiddleware(
        first.createRequestsFactoryMiddleware().middleware,
        second.createRequestsFactoryMiddleware().middleware
      )
    );

    await store.dispatch(secondApi.loadDataAction());
    await store.dispatch(secondApi.forcedLoadDataAction());
    expect(store.getState().firstEvents).toEqual([]);
    expect(store.getState().secondEvents).toEqual(secondTypes);

    await store.dispatch(firstApi.loadDataAction());
    expect(store.getState().firstEvents).toEqual([
      firstApi.requestFulfilledAction.type,
    ]);
    expect(store.getState().secondEvents).toEqual(secondTypes);
  });

  it.each([
    ['by default', undefined, undefined, 0],
    [
      'when middleware forwarding is disabled',
      { forwardFactoryActions: false },
      undefined,
      0,
    ],
    [
      'when middleware forwarding is enabled',
      { forwardFactoryActions: true },
      undefined,
      1,
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

    expect(cachedLoadPromise).toBe(loadPromise);

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
