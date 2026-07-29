import {
  isSomethingLoadingSelector,
  hydrateRequestsAction,
  RequestsStatuses,
  requestsFactory,
  stateRequestsKey,
} from '../src';
import { createDeferred, createRequestsTestStore } from './helpers';

describe('request Promise lifecycle', () => {
  it('isolates in-flight Promises between middleware instances', async () => {
    const firstRequest = createDeferred<string>();
    const secondRequest = createDeferred<string>();
    const request = jest
      .fn<Promise<string>, []>()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    const { loadDataAction, responseSelector } = requestsFactory({
      request,
      stateRequestKey: 'middleware-isolated-promises',
    });
    const firstStore = createRequestsTestStore().store;
    const secondStore = createRequestsTestStore().store;

    const firstPromise = firstStore.dispatch(loadDataAction());
    const secondPromise = secondStore.dispatch(loadDataAction());

    expect(firstPromise).not.toBe(secondPromise);
    expect(request).toHaveBeenCalledTimes(2);

    firstRequest.resolve('first store response');
    secondRequest.resolve('second store response');
    await Promise.all([firstPromise, secondPromise]);

    expect(responseSelector(firstStore.getState())).toBe(
      'first store response'
    );
    expect(responseSelector(secondStore.getState())).toBe(
      'second store response'
    );
  });

  it('isolates cancellation state between middleware instances', async () => {
    const firstRequest = createDeferred<string>();
    const secondRequest = createDeferred<string>();
    const request = jest
      .fn<Promise<string>, []>()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    const {
      cancelRequestAction,
      forcedLoadDataAction,
      requestStatusSelector,
      responseSelector,
    } = requestsFactory({
      request,
      stateRequestKey: 'middleware-isolated-cancellation',
    });
    const firstStore = createRequestsTestStore().store;
    const secondStore = createRequestsTestStore().store;

    const firstPromise = firstStore.dispatch(forcedLoadDataAction());
    const secondPromise = secondStore.dispatch(forcedLoadDataAction());
    await firstStore.dispatch(cancelRequestAction());

    firstRequest.resolve('ignored first response');
    secondRequest.resolve('second store response');
    await Promise.all([firstPromise, secondPromise]);

    expect(requestStatusSelector(firstStore.getState())).toBe(
      RequestsStatuses.Canceled
    );
    expect(responseSelector(firstStore.getState())).toBeUndefined();
    expect(requestStatusSelector(secondStore.getState())).toBe(
      RequestsStatuses.Success
    );
    expect(responseSelector(secondStore.getState())).toBe(
      'second store response'
    );
  });

  it('keeps the latest forced Promise when an older forced request settles', async () => {
    const { store } = createRequestsTestStore();
    const firstRequest = createDeferred<string>();
    const secondRequest = createDeferred<string>();
    const request = jest
      .fn<Promise<string>, []>()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    const { forcedLoadDataAction, loadDataAction, responseSelector } =
      requestsFactory({ request, stateRequestKey: 'latest-forced' });

    const firstPromise = store.dispatch(forcedLoadDataAction());
    const secondPromise = store.dispatch(forcedLoadDataAction());

    expect(firstPromise).not.toBe(secondPromise);
    expect(store.dispatch(loadDataAction())).toBe(secondPromise);

    firstRequest.resolve('old response');
    await firstPromise;

    expect(responseSelector(store.getState())).toBe('old response');
    expect(store.dispatch(loadDataAction())).toBe(secondPromise);

    secondRequest.resolve('latest response');
    await secondPromise;

    expect(responseSelector(store.getState())).toBe('latest response');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('changes requestVersion only when a replacement Promise starts', async () => {
    const { store } = createRequestsTestStore();
    const firstRequest = createDeferred<string>();
    const forcedRequest = createDeferred<string>();
    const request = jest
      .fn<Promise<string>, []>()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(forcedRequest.promise);
    const { forcedLoadDataAction, loadDataAction, requestVersionSelector } =
      requestsFactory({ request, stateRequestKey: 'request-version' });

    expect(requestVersionSelector(store.getState())).toBe(0);

    const firstPromise = store.dispatch(loadDataAction());
    expect(requestVersionSelector(store.getState())).toBe(1);

    expect(store.dispatch(loadDataAction())).toBe(firstPromise);
    expect(requestVersionSelector(store.getState())).toBe(1);

    const forcedPromise = store.dispatch(forcedLoadDataAction());
    expect(forcedPromise).not.toBe(firstPromise);
    expect(requestVersionSelector(store.getState())).toBe(2);

    firstRequest.resolve('old response');
    forcedRequest.resolve('latest response');
    await Promise.all([firstPromise, forcedPromise]);

    expect(requestVersionSelector(store.getState())).toBe(2);
  });

  it('deduplicates each serialized key independently', async () => {
    const { store } = createRequestsTestStore();
    const firstRequest = createDeferred<string>();
    const secondRequest = createDeferred<string>();
    const request = jest.fn(({ id }: { id: number }) =>
      id === 1 ? firstRequest.promise : secondRequest.promise
    );
    const { loadDataAction, responseSelector } = requestsFactory({
      request,
      stateRequestKey: 'serialized-promises',
      serializeRequestParameters: ({ id }: { id: number }) => `${id}`,
    });

    const firstPromise = store.dispatch(loadDataAction({ id: 1 }));
    const firstDuplicate = store.dispatch(loadDataAction({ id: 1 }));
    const secondPromise = store.dispatch(loadDataAction({ id: 2 }));

    expect(firstDuplicate).toBe(firstPromise);
    expect(secondPromise).not.toBe(firstPromise);
    expect(request).toHaveBeenCalledTimes(2);

    firstRequest.resolve('first');
    secondRequest.resolve('second');
    await Promise.all([firstPromise, secondPromise]);

    const responseByParams = responseSelector(store.getState());
    expect(responseByParams({ id: 1 })).toBe('first');
    expect(responseByParams({ id: 2 })).toBe('second');
  });

  it('resolves dispatch after a failed request and allows a normal retry', async () => {
    const { store } = createRequestsTestStore();
    const error = new Error('failed');
    const request = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('recovered');
    const {
      errorSelector,
      loadDataAction,
      requestStatusSelector,
      responseSelector,
    } = requestsFactory({ request, stateRequestKey: 'retry-after-error' });

    const failedPromise = store.dispatch(loadDataAction());
    await expect(failedPromise).resolves.toBeUndefined();

    expect(requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Failed
    );
    expect(errorSelector(store.getState())).toBe(error);

    const retryPromise = store.dispatch(loadDataAction());
    expect(retryPromise).not.toBe(failedPromise);
    await expect(retryPromise).resolves.toBeUndefined();

    expect(request).toHaveBeenCalledTimes(2);
    expect(requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Success
    );
    expect(responseSelector(store.getState())).toBe('recovered');
  });

  it('can disable retries for failed loads in one request factory', async () => {
    const { store } = createRequestsTestStore();
    const error = new Error('failed');
    const request = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('recovered');
    const api = requestsFactory({
      request,
      stateRequestKey: 'factory-no-retry-after-error',
      loadDataRetryStatuses: [],
    });

    const failedPromise = store.dispatch(api.loadDataAction());
    await failedPromise;
    const cachedFailedPromise = store.dispatch(api.loadDataAction());

    expect(cachedFailedPromise).toBe(failedPromise);
    await cachedFailedPromise;

    expect(request).toHaveBeenCalledTimes(1);
    expect(api.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Failed
    );
    expect(api.errorSelector(store.getState())).toBe(error);

    await store.dispatch(api.forcedLoadDataAction());

    expect(request).toHaveBeenCalledTimes(2);
    expect(api.responseSelector(store.getState())).toBe('recovered');
  });

  it('can disable retries for canceled loads in one request factory', async () => {
    const { store } = createRequestsTestStore();
    const firstRequest = createDeferred<string>();
    const request = jest
      .fn<Promise<string>, []>()
      .mockReturnValueOnce(firstRequest.promise)
      .mockResolvedValueOnce('recovered');
    const api = requestsFactory({
      request,
      stateRequestKey: 'factory-no-retry-after-cancel',
      loadDataRetryStatuses: [],
    });

    const requestPromise = store.dispatch(api.loadDataAction());
    await store.dispatch(api.cancelRequestAction());
    await requestPromise;
    const cachedCanceledPromise = store.dispatch(api.loadDataAction());

    expect(request).toHaveBeenCalledTimes(1);
    expect(cachedCanceledPromise).toBe(requestPromise);
    expect(api.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Canceled
    );

    await store.dispatch(api.forcedLoadDataAction());

    expect(request).toHaveBeenCalledTimes(2);
    expect(api.responseSelector(store.getState())).toBe('recovered');
  });

  it('uses middleware retry statuses when a factory has no override', async () => {
    const { store } = createRequestsTestStore({
      loadDataRetryStatuses: [],
    });
    const request = jest
      .fn<Promise<string>, []>()
      .mockRejectedValue(new Error('failed'));
    const api = requestsFactory({
      request,
      stateRequestKey: 'middleware-no-retry-after-error',
    });

    await store.dispatch(api.loadDataAction());
    await store.dispatch(api.loadDataAction());

    expect(request).toHaveBeenCalledTimes(1);
  });

  it('prefers factory retry statuses over the middleware setting', async () => {
    const { store } = createRequestsTestStore({
      loadDataRetryStatuses: [],
    });
    const request = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce('recovered');
    const api = requestsFactory({
      request,
      stateRequestKey: 'factory-retry-override',
      loadDataRetryStatuses: [RequestsStatuses.Failed],
    });

    await store.dispatch(api.loadDataAction());
    await store.dispatch(api.loadDataAction());

    expect(request).toHaveBeenCalledTimes(2);
    expect(api.responseSelector(store.getState())).toBe('recovered');
  });

  it('retries a preloaded failure only once in a new middleware runtime', async () => {
    const stateRequestKey = 'preloaded-failed-retry';
    const preloadedError = new Error('server failed');
    const { store } = createRequestsTestStore(
      {
        loadDataRetryStatuses: [],
        loadDataHydratedRetryStatuses: [RequestsStatuses.Failed],
      },
      {
        [stateRequestsKey]: {
          global_loading: { count: 0 },
          responses: {
            [stateRequestKey]: {
              status: RequestsStatuses.Failed,
              error: preloadedError,
            },
          },
        },
      }
    );
    const clientError = new Error('client failed');
    const request = jest
      .fn<Promise<string>, []>()
      .mockRejectedValue(clientError);
    const api = requestsFactory({ request, stateRequestKey });

    await store.dispatch(api.loadDataAction());
    await store.dispatch(api.loadDataAction());

    expect(request).toHaveBeenCalledTimes(1);
    expect(api.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Failed
    );
    expect(api.errorSelector(store.getState())).toBe(clientError);
  });

  it('retries a preloaded cancellation once but not a client cancellation', async () => {
    const stateRequestKey = 'preloaded-canceled-retry';
    const { store } = createRequestsTestStore(
      {
        loadDataRetryStatuses: [],
        loadDataHydratedRetryStatuses: [RequestsStatuses.Canceled],
      },
      {
        [stateRequestsKey]: {
          global_loading: { count: 0 },
          responses: {
            [stateRequestKey]: {
              status: RequestsStatuses.Canceled,
            },
          },
        },
      }
    );
    const clientRequest = createDeferred<string>();
    const request = jest.fn(() => clientRequest.promise);
    const api = requestsFactory({ request, stateRequestKey });

    const retryPromise = store.dispatch(api.loadDataAction());

    expect(request).toHaveBeenCalledTimes(1);

    await store.dispatch(api.cancelRequestAction());
    await retryPromise;
    await store.dispatch(api.loadDataAction());

    expect(request).toHaveBeenCalledTimes(1);
    expect(api.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Canceled
    );
  });

  it('inherits normal retry statuses for hydrated state by default', async () => {
    const stateRequestKey = 'default-preloaded-failed-retry';
    const { store } = createRequestsTestStore(undefined, {
      [stateRequestsKey]: {
        global_loading: { count: 0 },
        responses: {
          [stateRequestKey]: {
            status: RequestsStatuses.Failed,
          },
        },
      },
    });
    const request = jest.fn(() => Promise.resolve('recovered'));
    const api = requestsFactory({ request, stateRequestKey });

    await store.dispatch(api.loadDataAction());

    expect(request).toHaveBeenCalledTimes(1);
    expect(api.responseSelector(store.getState())).toBe('recovered');
  });

  it('creates one stable settled Promise for preloaded successful data', async () => {
    const stateRequestKey = 'preloaded-success-promise';
    const { store } = createRequestsTestStore(undefined, {
      [stateRequestsKey]: {
        global_loading: { count: 0 },
        responses: {
          [stateRequestKey]: {
            status: RequestsStatuses.Success,
            response: 'server response',
          },
        },
      },
    });
    const request = jest.fn(() => Promise.resolve('unexpected'));
    const api = requestsFactory({ request, stateRequestKey });

    const firstPromise = store.dispatch(api.loadDataAction());
    const secondPromise = store.dispatch(api.loadDataAction());

    expect(secondPromise).toBe(firstPromise);
    await expect(firstPromise).resolves.toBeUndefined();
    expect(request).not.toHaveBeenCalled();
  });

  it('creates one stable settled Promise for a non-retryable preloaded error', async () => {
    const stateRequestKey = 'preloaded-failed-promise';
    const { store } = createRequestsTestStore(
      {
        loadDataRetryStatuses: [],
        loadDataHydratedRetryStatuses: [],
      },
      {
        [stateRequestsKey]: {
          global_loading: { count: 0 },
          responses: {
            [stateRequestKey]: {
              status: RequestsStatuses.Failed,
            },
          },
        },
      }
    );
    const request = jest.fn(() => Promise.resolve('unexpected'));
    const api = requestsFactory({ request, stateRequestKey });

    const firstPromise = store.dispatch(api.loadDataAction());
    const secondPromise = store.dispatch(api.loadDataAction());

    expect(secondPromise).toBe(firstPromise);
    await expect(firstPromise).resolves.toBeUndefined();
    expect(request).not.toHaveBeenCalled();
  });

  it('does not treat a failure created by this runtime as hydrated', async () => {
    const { store } = createRequestsTestStore({
      loadDataRetryStatuses: [],
      loadDataHydratedRetryStatuses: [RequestsStatuses.Failed],
    });
    const request = jest
      .fn<Promise<string>, []>()
      .mockRejectedValue(new Error('failed'));
    const api = requestsFactory({
      request,
      stateRequestKey: 'local-failed-no-hydrated-retry',
    });

    await store.dispatch(api.loadDataAction());
    await store.dispatch(api.loadDataAction());

    expect(request).toHaveBeenCalledTimes(1);
  });

  it('prefers factory hydrated retry statuses over middleware config', async () => {
    const stateRequestKey = 'factory-hydrated-retry-override';
    const { store } = createRequestsTestStore(
      {
        loadDataRetryStatuses: [],
        loadDataHydratedRetryStatuses: [],
      },
      {
        [stateRequestsKey]: {
          global_loading: { count: 0 },
          responses: {
            [stateRequestKey]: {
              status: RequestsStatuses.Failed,
            },
          },
        },
      }
    );
    const request = jest
      .fn<Promise<string>, []>()
      .mockRejectedValue(new Error('failed'));
    const api = requestsFactory({
      request,
      stateRequestKey,
      loadDataHydratedRetryStatuses: [RequestsStatuses.Failed],
    });

    await store.dispatch(api.loadDataAction());
    await store.dispatch(api.loadDataAction());

    expect(request).toHaveBeenCalledTimes(1);
  });

  it('allows one retry for each matching hydrate action and request key', async () => {
    const { store } = createRequestsTestStore({
      loadDataRetryStatuses: [],
      loadDataHydratedRetryStatuses: [RequestsStatuses.Failed],
    });
    const usersRequest = jest
      .fn<Promise<string>, []>()
      .mockRejectedValue(new Error('users failed'));
    const postsRequest = jest
      .fn<Promise<string>, []>()
      .mockRejectedValue(new Error('posts failed'));
    const users = requestsFactory({
      request: usersRequest,
      stateRequestKey: 'hydrated-users',
    });
    const posts = requestsFactory({
      request: postsRequest,
      stateRequestKey: 'local-posts',
    });

    await store.dispatch(users.loadDataAction());
    await store.dispatch(posts.loadDataAction());

    const hydrateUsersFailure = () =>
      store.dispatch(
        hydrateRequestsAction({
          global_loading: { count: 0 },
          responses: {
            'hydrated-users': {
              status: RequestsStatuses.Failed,
            },
          },
        })
      );

    hydrateUsersFailure();
    await store.dispatch(users.loadDataAction());
    await store.dispatch(users.loadDataAction());
    await store.dispatch(posts.loadDataAction());

    expect(usersRequest).toHaveBeenCalledTimes(2);
    expect(postsRequest).toHaveBeenCalledTimes(1);

    hydrateUsersFailure();
    await store.dispatch(users.loadDataAction());
    await store.dispatch(users.loadDataAction());

    expect(usersRequest).toHaveBeenCalledTimes(3);
  });

  it('tracks hydrated retries independently for serialized request keys', async () => {
    const { store } = createRequestsTestStore({
      loadDataRetryStatuses: [],
      loadDataHydratedRetryStatuses: [RequestsStatuses.Failed],
    });
    const request = jest
      .fn<Promise<string>, [{ id: number }]>()
      .mockRejectedValue(new Error('failed'));
    const api = requestsFactory({
      request,
      stateRequestKey: 'hydrated-serialized-users',
      serializeRequestParameters: ({ id }: { id: number }) => `${id}`,
    });

    await store.dispatch(api.loadDataAction({ id: 1 }));
    await store.dispatch(api.loadDataAction({ id: 2 }));

    store.dispatch(
      hydrateRequestsAction({
        global_loading: { count: 0 },
        responses: {
          'hydrated-serialized-users': {
            '1': { status: RequestsStatuses.Failed },
          },
        },
      })
    );

    await store.dispatch(api.loadDataAction({ id: 1 }));
    await store.dispatch(api.loadDataAction({ id: 1 }));
    await store.dispatch(api.loadDataAction({ id: 2 }));

    expect(request).toHaveBeenCalledTimes(3);
    expect(request.mock.calls.map(([params]) => params)).toEqual([
      { id: 1 },
      { id: 2 },
      { id: 1 },
    ]);
  });

  it('settles a canceled request Promise, releases deduplication, and ignores its late result', async () => {
    const { store } = createRequestsTestStore();
    const firstRequest = createDeferred<string>();
    const secondRequest = createDeferred<string>();
    const request = jest
      .fn<Promise<string>, []>()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    const {
      cancelRequestAction,
      loadDataAction,
      requestStatusSelector,
      responseSelector,
    } = requestsFactory({ request, stateRequestKey: 'cancel-promise' });

    const requestPromise = store.dispatch(loadDataAction());
    await store.dispatch(cancelRequestAction());

    expect(requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Canceled
    );
    await expect(requestPromise).resolves.toBeUndefined();

    const retryPromise = store.dispatch(loadDataAction());

    expect(retryPromise).not.toBe(requestPromise);
    expect(request).toHaveBeenCalledTimes(2);

    firstRequest.resolve('ignored');
    await Promise.resolve();
    await Promise.resolve();
    expect(responseSelector(store.getState())).toBeUndefined();

    secondRequest.resolve('retry response');
    await retryPromise;
    expect(responseSelector(store.getState())).toBe('retry response');
  });

  it('reset changes Redux state but does not cancel active request work', async () => {
    const { store } = createRequestsTestStore();
    const deferredRequest = createDeferred<string>();
    const {
      loadDataAction,
      requestStatusSelector,
      resetRequestAction,
      responseSelector,
    } = requestsFactory({
      request: () => deferredRequest.promise,
      stateRequestKey: 'reset-active',
    });

    const requestPromise = store.dispatch(loadDataAction());
    await store.dispatch(resetRequestAction());

    expect(requestStatusSelector(store.getState())).toBe(RequestsStatuses.None);
    expect(responseSelector(store.getState())).toBeUndefined();

    deferredRequest.resolve('late response');
    await requestPromise;

    expect(requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Success
    );
    expect(responseSelector(store.getState())).toBe('late response');
  });

  it('cancels only the latest of several forced requests', async () => {
    const { store } = createRequestsTestStore();
    const firstRequest = createDeferred<string>();
    const secondRequest = createDeferred<string>();
    const request = jest
      .fn<Promise<string>, []>()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    const {
      cancelRequestAction,
      forcedLoadDataAction,
      requestStatusSelector,
      responseSelector,
    } = requestsFactory({ request, stateRequestKey: 'cancel-latest' });

    const firstPromise = store.dispatch(forcedLoadDataAction());
    const secondPromise = store.dispatch(forcedLoadDataAction());
    await store.dispatch(cancelRequestAction());

    expect(requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Canceled
    );

    firstRequest.resolve('first active response');
    await firstPromise;
    expect(responseSelector(store.getState())).toBe('first active response');

    secondRequest.resolve('ignored latest response');
    await secondPromise;
    expect(responseSelector(store.getState())).toBe('first active response');
  });

  it('cancelAllRequests cancels every active execution and allows new work', async () => {
    const { cancelAllRequests, store, toPromise } = createRequestsTestStore();
    const firstUserRequest = createDeferred<string>();
    const secondUserRequest = createDeferred<string>();
    const retryUserRequest = createDeferred<string>();
    const postsRequest = createDeferred<string>();
    const userRequests = [
      firstUserRequest,
      secondUserRequest,
      retryUserRequest,
    ];
    const userSignals: AbortSignal[] = [];
    let userRequestIndex = 0;
    const users = requestsFactory({
      request: (
        _params: { id: number },
        { signal }: { signal?: AbortSignal }
      ) => {
        if (signal) {
          userSignals.push(signal);
        }

        return userRequests[userRequestIndex++].promise;
      },
      stateRequestKey: 'cancel-all-users',
      serializeRequestParameters: ({ id }: { id: number }) => `${id}`,
    });
    let postsSignal: AbortSignal | undefined;
    const posts = requestsFactory({
      request: (_params: undefined, { signal }: { signal?: AbortSignal }) => {
        postsSignal = signal;
        return postsRequest.promise;
      },
      stateRequestKey: 'cancel-all-posts',
    });

    const firstUserPromise = store.dispatch(
      users.forcedLoadDataAction({ id: 1 })
    );
    const secondUserPromise = store.dispatch(
      users.forcedLoadDataAction({ id: 1 })
    );
    const postsPromise = store.dispatch(posts.loadDataAction());
    const aggregatePromise = toPromise();

    expect(isSomethingLoadingSelector(store.getState())).toBe(true);

    await cancelAllRequests();
    await Promise.all([firstUserPromise, secondUserPromise, postsPromise]);
    await aggregatePromise;

    expect(userSignals).toHaveLength(2);
    expect(userSignals.every((signal) => signal.aborted)).toBe(true);
    expect(postsSignal?.aborted).toBe(true);
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);
    expect(users.requestStatusSelector(store.getState())({ id: 1 })).toBe(
      RequestsStatuses.Canceled
    );
    expect(posts.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Canceled
    );

    const retryPromise = store.dispatch(users.loadDataAction({ id: 1 }));

    expect(userSignals).toHaveLength(3);
    expect(userSignals[2].aborted).toBe(false);

    firstUserRequest.resolve('ignored first user');
    secondUserRequest.resolve('ignored second user');
    postsRequest.resolve('ignored posts');
    await Promise.resolve();
    await Promise.resolve();

    expect(users.responseSelector(store.getState())({ id: 1 })).toBeUndefined();
    expect(posts.responseSelector(store.getState())).toBeUndefined();

    retryUserRequest.resolve('fresh user');
    await retryPromise;

    expect(users.responseSelector(store.getState())({ id: 1 })).toBe(
      'fresh user'
    );
  });

  it('isolates cancelAllRequests between middleware instances', async () => {
    const firstRequest = createDeferred<string>();
    const secondRequest = createDeferred<string>();
    const signals: AbortSignal[] = [];
    let requestIndex = 0;
    const api = requestsFactory({
      request: (_params: undefined, { signal }: { signal?: AbortSignal }) => {
        if (signal) {
          signals.push(signal);
        }

        return [firstRequest, secondRequest][requestIndex++].promise;
      },
      stateRequestKey: 'cancel-all-isolation',
    });
    const firstRuntime = createRequestsTestStore();
    const secondRuntime = createRequestsTestStore();

    const firstPromise = firstRuntime.store.dispatch(api.loadDataAction());
    const secondPromise = secondRuntime.store.dispatch(api.loadDataAction());

    await firstRuntime.cancelAllRequests();
    await firstPromise;

    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
    expect(api.requestStatusSelector(firstRuntime.store.getState())).toBe(
      RequestsStatuses.Canceled
    );

    secondRequest.resolve('second response');
    await secondPromise;

    expect(api.responseSelector(secondRuntime.store.getState())).toBe(
      'second response'
    );

    firstRequest.resolve('ignored first response');
  });

  it('toPromise waits for every request tracked by the middleware', async () => {
    const { store, toPromise } = createRequestsTestStore();
    const usersRequest = createDeferred<string>();
    const postsRequest = createDeferred<string>();
    const users = requestsFactory({
      request: () => usersRequest.promise,
      stateRequestKey: 'aggregate-users',
    });
    const posts = requestsFactory({
      request: () => postsRequest.promise,
      stateRequestKey: 'aggregate-posts',
    });

    const usersPromise = store.dispatch(users.loadDataAction());
    const postsPromise = store.dispatch(posts.loadDataAction());
    let aggregateResolved = false;
    const aggregatePromise = toPromise().then(() => {
      aggregateResolved = true;
    });
    const trackedAggregatePromise = toPromise();

    expect(toPromise()).toBe(trackedAggregatePromise);

    usersRequest.resolve('users');
    await usersPromise;
    await Promise.resolve();
    expect(aggregateResolved).toBe(false);

    postsRequest.resolve('posts');
    await postsPromise;
    await aggregatePromise;
    expect(toPromise()).toBe(trackedAggregatePromise);
    expect(aggregateResolved).toBe(true);
  });

  it('does not retrack a settled cached Promise as active work', async () => {
    const { store, toPromise } = createRequestsTestStore();
    const deferredRequest = createDeferred<string>();
    const api = requestsFactory({
      request: () => deferredRequest.promise,
      stateRequestKey: 'settled-aggregate-promise',
    });

    const requestPromise = store.dispatch(api.loadDataAction());
    const aggregatePromise = toPromise();

    deferredRequest.resolve('response');
    await requestPromise;
    await aggregatePromise;

    expect(store.dispatch(api.loadDataAction())).toBe(requestPromise);
    expect(toPromise()).toBe(aggregatePromise);
  });
});
