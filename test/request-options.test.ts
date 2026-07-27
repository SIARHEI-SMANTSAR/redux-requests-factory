import { isSomethingLoadingSelector, requestsFactory } from '../src';
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

  it('keeps a silent request and its cancellation out of global loading', async () => {
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

    await store.dispatch(cancelRequestAction(undefined, { silent: true }));
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);

    deferredRequest.resolve('ignored');
    await requestPromise;
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);
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
