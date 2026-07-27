import { RequestsStatuses, requestsFactory } from '../src';
import { createDeferred, createRequestsTestStore } from './helpers';

describe('request Promise lifecycle', () => {
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

  it('keeps a canceled request Promise pending and ignores its late result', async () => {
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
    expect(store.dispatch(loadDataAction())).toBe(requestPromise);

    let settled = false;
    requestPromise.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    firstRequest.resolve('ignored');
    await requestPromise;

    expect(requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Canceled
    );
    expect(responseSelector(store.getState())).toBeUndefined();

    const retryPromise = store.dispatch(loadDataAction());
    expect(request).toHaveBeenCalledTimes(2);
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

    usersRequest.resolve('users');
    await usersPromise;
    await Promise.resolve();
    expect(aggregateResolved).toBe(false);

    postsRequest.resolve('posts');
    await postsPromise;
    await aggregatePromise;
    expect(aggregateResolved).toBe(true);
  });
});
