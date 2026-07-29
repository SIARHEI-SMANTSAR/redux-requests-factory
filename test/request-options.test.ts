import {
  isSomethingLoadingSelector,
  RequestsStatuses,
  requestsFactory,
} from '../src';
import { createDeferred, createRequestsTestStore } from './helpers';

describe('request loading options', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('tracks a normal pending request in global loading state', async () => {
    const { store } = createRequestsTestStore();
    const deferredRequest = createDeferred<string>();
    const { loadDataAction } = requestsFactory({
      request: () => deferredRequest.promise,
      stateRequestKey: 'global-loading-default',
    });

    const requestPromise = store.dispatch(loadDataAction());
    expect(isSomethingLoadingSelector(store.getState())).toBe(true);

    deferredRequest.resolve('response');
    await requestPromise;
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);
  });

  it('remembers that the canceled request was silent', async () => {
    const { store } = createRequestsTestStore();
    const deferredRequest = createDeferred<string>();
    const { cancelRequestAction, loadDataAction } = requestsFactory({
      request: () => deferredRequest.promise,
      stateRequestKey: 'global-loading-silent',
    });

    const requestPromise = store.dispatch(
      loadDataAction(undefined, { silent: true })
    );
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);

    await store.dispatch(cancelRequestAction());
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);

    deferredRequest.resolve('ignored');
    await requestPromise;
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);
  });

  it('decrements global loading even when cancellation is marked silent', async () => {
    const { store } = createRequestsTestStore();
    const deferredRequest = createDeferred<string>();
    const { cancelRequestAction, loadDataAction } = requestsFactory({
      request: () => deferredRequest.promise,
      stateRequestKey: 'global-loading-cancel-option',
    });

    const requestPromise = store.dispatch(loadDataAction());
    expect(isSomethingLoadingSelector(store.getState())).toBe(true);

    await store.dispatch(cancelRequestAction(undefined, { silent: true }));
    await requestPromise;
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);

    deferredRequest.resolve('ignored');
  });

  it('excludes a request from global loading through factory config', async () => {
    const { store } = createRequestsTestStore();
    const deferredRequest = createDeferred<string>();
    const { loadDataAction } = requestsFactory({
      request: () => deferredRequest.promise,
      stateRequestKey: 'global-loading-excluded',
      includeInGlobalLoading: false,
    });

    const requestPromise = store.dispatch(loadDataAction());
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);

    deferredRequest.resolve('response');
    await requestPromise;
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);
  });

  it('removes a long request from global loading after its timeout', async () => {
    jest.useFakeTimers();
    const { store } = createRequestsTestStore();
    const deferredRequest = createDeferred<string>();
    const { loadDataAction } = requestsFactory({
      request: () => deferredRequest.promise,
      stateRequestKey: 'global-loading-timeout',
      globalLoadingTimeout: 100,
    });

    const requestPromise = store.dispatch(loadDataAction());
    expect(isSomethingLoadingSelector(store.getState())).toBe(true);

    jest.advanceTimersByTime(100);
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);

    deferredRequest.resolve('response');
    await requestPromise;
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);
  });

  it('tracks a fast request correctly after an earlier request timed out', async () => {
    jest.useFakeTimers();
    const { store } = createRequestsTestStore();
    const firstRequest = createDeferred<string>();
    const secondRequest = createDeferred<string>();
    const request = jest
      .fn<Promise<string>, [{ id: number }]>()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    const { loadDataAction } = requestsFactory({
      request,
      stateRequestKey: 'global-loading-after-timeout',
      serializeRequestParameters: ({ id }: { id: number }) => `${id}`,
      globalLoadingTimeout: 100,
    });

    const firstPromise = store.dispatch(loadDataAction({ id: 1 }));
    jest.advanceTimersByTime(100);
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);

    firstRequest.resolve('first');
    await firstPromise;

    const secondPromise = store.dispatch(loadDataAction({ id: 2 }));
    expect(isSomethingLoadingSelector(store.getState())).toBe(true);

    secondRequest.resolve('second');
    await secondPromise;
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);
  });

  it('clears the global loading timeout after a request fails', async () => {
    jest.useFakeTimers();
    const { store } = createRequestsTestStore();
    const { loadDataAction } = requestsFactory({
      request: () => Promise.reject(new Error('failed')),
      stateRequestKey: 'global-loading-error-timeout',
      globalLoadingTimeout: 100,
    });

    await store.dispatch(loadDataAction());
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);

    expect(jest.getTimerCount()).toBe(0);
    jest.runOnlyPendingTimers();
  });

  it('isolates global loading timeouts between parameter keys', async () => {
    jest.useFakeTimers();
    const { store } = createRequestsTestStore();
    const firstRequest = createDeferred<string>();
    const secondRequest = createDeferred<string>();
    const request = jest
      .fn<Promise<string>, [{ id: number }]>()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    const { loadDataAction } = requestsFactory({
      request,
      stateRequestKey: 'global-loading-parallel-timeouts',
      serializeRequestParameters: ({ id }: { id: number }) => `${id}`,
      globalLoadingTimeout: 100,
    });

    const firstPromise = store.dispatch(loadDataAction({ id: 1 }));
    jest.advanceTimersByTime(50);
    const secondPromise = store.dispatch(loadDataAction({ id: 2 }));

    jest.advanceTimersByTime(50);
    expect(isSomethingLoadingSelector(store.getState())).toBe(true);

    secondRequest.resolve('second');
    await secondPromise;
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);

    firstRequest.resolve('first');
    await firstPromise;
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);
  });

  it('aborts request work that consumes the cancellation signal', async () => {
    const { store } = createRequestsTestStore();
    let receivedSignal: AbortSignal | undefined;
    const request = jest.fn(
      (_params: undefined, { signal }: { signal?: AbortSignal }) =>
        new Promise<string>((_resolve, reject) => {
          receivedSignal = signal;
          signal?.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        })
    );
    const { cancelRequestAction, loadDataAction } = requestsFactory({
      request,
      stateRequestKey: 'abort-signal',
    });

    const requestPromise = store.dispatch(loadDataAction());
    await store.dispatch(cancelRequestAction());
    await requestPromise;

    expect(receivedSignal?.aborted).toBe(true);
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);
  });
});

describe('request cache freshness', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('reloads successful data after staleTime elapses', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const { store } = createRequestsTestStore();
    const request = jest.fn(() => Promise.resolve('response'));
    const { loadDataAction } = requestsFactory({
      request,
      stateRequestKey: 'stale-time',
      staleTime: 100,
    });

    const initialPromise = store.dispatch(loadDataAction());
    await initialPromise;
    expect(store.dispatch(loadDataAction())).toBe(initialPromise);
    expect(request).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(99);
    expect(store.dispatch(loadDataAction())).toBe(initialPromise);
    expect(request).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);
    const refreshPromise = store.dispatch(loadDataAction());
    expect(refreshPromise).not.toBe(initialPromise);
    await refreshPromise;
    expect(request).toHaveBeenCalledTimes(2);
  });
});

describe('request debounce', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces the same key while allowing independent parameter keys', async () => {
    jest.useFakeTimers();
    const { store } = createRequestsTestStore();
    const request = jest.fn(({ id }: { id: number }) => Promise.resolve(id));
    const { forcedLoadDataAction } = requestsFactory({
      request,
      stateRequestKey: 'debounce-keys',
      useDebounce: true,
      debounceWait: 100,
      stringifyParamsForDebounce: ({ id }) => `${id}`,
    });

    await Promise.all([
      store.dispatch(forcedLoadDataAction({ id: 1 })),
      store.dispatch(forcedLoadDataAction({ id: 1 })),
    ]);
    expect(request).toHaveBeenCalledTimes(1);

    await store.dispatch(forcedLoadDataAction({ id: 2 }));
    expect(request).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(100);
    await store.dispatch(forcedLoadDataAction({ id: 1 }));
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('resets the debounce cache when the active request is canceled', async () => {
    jest.useFakeTimers();
    const { store } = createRequestsTestStore();
    const firstRequest = createDeferred<string>();
    const secondRequest = createDeferred<string>();
    const request = jest
      .fn<Promise<string>, [{ id: number }]>()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    const { cancelRequestAction, forcedLoadDataAction } = requestsFactory({
      request,
      stateRequestKey: 'debounce-cancel',
      useDebounce: true,
      debounceWait: 100,
      stringifyParamsForDebounce: ({ id }) => `${id}`,
    });

    const firstPromise = store.dispatch(forcedLoadDataAction({ id: 1 }));
    await store.dispatch(cancelRequestAction({ id: 1 }));
    const secondPromise = store.dispatch(forcedLoadDataAction({ id: 1 }));

    expect(request).toHaveBeenCalledTimes(2);

    firstRequest.resolve('ignored');
    secondRequest.resolve('response');
    await Promise.all([firstPromise, secondPromise]);
  });

  it('cancelAllRequests prevents a trailing debounced request from starting', async () => {
    jest.useFakeTimers();
    const { cancelAllRequests, store } = createRequestsTestStore();
    const request = jest.fn(() => Promise.resolve('unexpected'));
    const { loadDataAction, requestStatusSelector } = requestsFactory({
      request,
      stateRequestKey: 'debounce-cancel-all-pending',
      useDebounce: true,
      debounceWait: 100,
      debounceOptions: {
        leading: false,
        trailing: true,
      },
    });

    const requestPromise = store.dispatch(loadDataAction());

    expect(request).not.toHaveBeenCalled();

    await cancelAllRequests();
    await requestPromise;

    expect(requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Canceled
    );

    jest.advanceTimersByTime(100);
    await Promise.resolve();

    expect(request).not.toHaveBeenCalled();
  });

  it('falls back to params identity when debounce serialization throws', async () => {
    jest.useFakeTimers();
    const { store } = createRequestsTestStore();
    const request = jest.fn(({ id }: { id: number }) => Promise.resolve(id));
    const params = { id: 1 };
    const { forcedLoadDataAction } = requestsFactory({
      request,
      stateRequestKey: 'debounce-fallback',
      useDebounce: true,
      debounceWait: 100,
      stringifyParamsForDebounce: () => {
        throw new Error('cannot serialize');
      },
    });

    await Promise.all([
      store.dispatch(forcedLoadDataAction(params)),
      store.dispatch(forcedLoadDataAction(params)),
    ]);
    await store.dispatch(forcedLoadDataAction({ id: 1 }));

    expect(request).toHaveBeenCalledTimes(2);
  });
});
