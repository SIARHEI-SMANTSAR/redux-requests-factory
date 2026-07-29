import {
  isSomethingLoadingSelector,
  RequestsStatuses,
  requestsFactory,
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

    await expect(store.dispatch(loadDataAction())).resolves.toBeUndefined();

    expect(requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Failed
    );
    expect(errorSelector(store.getState())).toBe(error);

    await expect(store.dispatch(loadDataAction())).resolves.toBeUndefined();

    expect(request).toHaveBeenCalledTimes(2);
    expect(requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Success
    );
    expect(responseSelector(store.getState())).toBe('recovered');
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
});
