import {
  FactoryActionTypes,
  RequestsStatuses,
  hydrateRequestsAction,
  isSomethingLoadingSelector,
  requestsFactory,
  requestsStateSelector,
} from '../src';
import type { Dispatch } from 'redux';
import { RESPONSES_STATE_KEY } from '../src/constants';
import { createDeferred, createRequestsTestStore } from './helpers';

describe('request factory config', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('passes params and an AbortSignal context to request', async () => {
    const { store } = createRequestsTestStore();
    const request = jest.fn(
      ({ id }: { id: number }, { signal }: { signal?: AbortSignal }) =>
        Promise.resolve({ id, aborted: signal?.aborted })
    );
    const api = requestsFactory({
      request,
      stateRequestKey: 'config-request-context',
    });

    await store.dispatch(api.loadDataAction({ id: 3 }));

    expect(request).toHaveBeenCalledWith(
      { id: 3 },
      { signal: expect.any(AbortSignal) }
    );
    expect(api.responseSelector(store.getState())).toEqual({
      id: 3,
      aborted: false,
    });
  });

  it('registers duplicate stateRequestKey values as independent keys', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { store } = createRequestsTestStore();
    const first = requestsFactory({
      request: () => Promise.resolve('first'),
      stateRequestKey: 'duplicate-config-key',
    });
    const second = requestsFactory({
      request: () => Promise.resolve('second'),
      stateRequestKey: 'duplicate-config-key',
    });

    expect(first.loadDataAction().meta.key).toBe('duplicate-config-key');
    expect(second.loadDataAction().meta.key).toBe('duplicate-config-key_2');

    await store.dispatch(first.loadDataAction());
    await store.dispatch(second.loadDataAction());

    expect(first.responseSelector(store.getState())).toBe('first');
    expect(second.responseSelector(store.getState())).toBe('second');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('duplicate-config-key_2')
    );
  });

  it('uses one shared cache entry for required params without serialization', async () => {
    const { store } = createRequestsTestStore();
    const request = jest.fn(({ id }: { id: number }) =>
      Promise.resolve(`response-${id}`)
    );
    const api = requestsFactory({
      request,
      stateRequestKey: 'config-shared-param-cache',
    });

    await store.dispatch(api.loadDataAction({ id: 1 }));
    await store.dispatch(api.loadDataAction({ id: 2 }));

    expect(request).toHaveBeenCalledTimes(1);
    expect(api.responseSelector(store.getState())).toBe('response-1');
  });

  it('supports an empty serialized parameter key', async () => {
    const { store } = createRequestsTestStore();
    const request = jest.fn(() => Promise.resolve('response'));
    const api = requestsFactory({
      request: (_params: { scope: string }) => request(),
      stateRequestKey: 'config-empty-serialized-key',
      serializeRequestParameters: () => '',
    });
    const params = { scope: 'default' };

    await store.dispatch(api.loadDataAction(params));
    await store.dispatch(api.loadDataAction(params));

    expect(request).toHaveBeenCalledTimes(1);
    expect(api.responseSelector(store.getState())(params)).toBe('response');
    expect(api.isLoadedSelector(store.getState())(params)).toBe(true);
  });

  it('keeps transformResponse selector-only and stores the raw response', async () => {
    const { store } = createRequestsTestStore();
    const api = requestsFactory({
      request: () => Promise.resolve({ name: 'Ada' }),
      stateRequestKey: 'config-transform-response',
      transformResponse: (response?: { name: string }) =>
        response?.name.toUpperCase(),
    });

    await store.dispatch(api.loadDataAction());

    expect(api.responseSelector(store.getState())).toBe('ADA');
    expect(
      requestsStateSelector(store.getState())[RESPONSES_STATE_KEY][
        'config-transform-response'
      ]
    ).toEqual(
      expect.objectContaining({
        status: RequestsStatuses.Success,
        response: { name: 'Ada' },
      })
    );
  });

  it('transforms errors for selectors and side effects but stores the raw error', async () => {
    const { store } = createRequestsTestStore();
    const rawError = new Error('network failed');
    const rejectedAction = jest.fn(() => ({ type: 'CONFIG_REJECTED' }));
    const api = requestsFactory({
      request: () => Promise.reject(rawError),
      stateRequestKey: 'config-transform-error',
      transformError: (error: unknown) =>
        error instanceof Error ? error.message : 'unknown',
      rejectedActions: [rejectedAction],
    });

    await store.dispatch(api.loadDataAction());

    expect(api.errorSelector(store.getState())).toBe('network failed');
    expect(
      requestsStateSelector(store.getState())[RESPONSES_STATE_KEY][
        'config-transform-error'
      ]
    ).toEqual(
      expect.objectContaining({
        status: RequestsStatuses.Failed,
        error: rawError,
      })
    );
    expect(rejectedAction).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'network failed',
        request: undefined,
        state: expect.objectContaining({
          requests: expect.objectContaining({
            global_loading: { count: 1 },
          }),
        }),
      })
    );
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);
  });

  it('passes post-success state to fulfilled action factories', async () => {
    const { store } = createRequestsTestStore();
    const fulfilledAction = jest.fn(() => ({ type: 'CONFIG_FULFILLED' }));
    const api = requestsFactory({
      request: ({ id }: { id: number }) => Promise.resolve(`response-${id}`),
      stateRequestKey: 'config-fulfilled-state',
      fulfilledActions: [fulfilledAction],
    });

    await store.dispatch(api.loadDataAction({ id: 4 }));

    expect(fulfilledAction).toHaveBeenCalledWith(
      expect.objectContaining({
        request: { id: 4 },
        response: 'response-4',
        state: expect.objectContaining({
          requests: expect.objectContaining({
            global_loading: { count: 1 },
          }),
        }),
      })
    );
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);
  });

  it('does not repeat fulfilled lifecycle events for cached loads by default', async () => {
    const { recordedActions, store } = createRequestsTestStore();
    const fulfilledAction = jest.fn(() => ({
      type: 'DEFAULT_CACHED_SIDE_EFFECT',
    }));
    const api = requestsFactory({
      request: () => Promise.resolve('response'),
      stateRequestKey: 'config-default-cached-fulfilled',
      fulfilledActions: [fulfilledAction],
    });
    const fulfilledType = api.requestFulfilledAction.type;

    await store.dispatch(api.loadDataAction());
    await store.dispatch(api.loadDataAction());

    expect(fulfilledAction).toHaveBeenCalledTimes(1);
    expect(
      recordedActions.filter(({ type }) => type === fulfilledType)
    ).toHaveLength(1);
  });

  it('treats every success as immediately stale when staleTime is zero', async () => {
    const { store } = createRequestsTestStore();
    const request = jest.fn(() => Promise.resolve('response'));
    const api = requestsFactory({
      request,
      stateRequestKey: 'config-zero-stale-time',
      staleTime: 0,
    });

    await store.dispatch(api.loadDataAction());
    await store.dispatch(api.loadDataAction());

    expect(request).toHaveBeenCalledTimes(2);
  });

  it('retains the cached response while stale data is refreshing', async () => {
    const { store } = createRequestsTestStore();
    const refresh = createDeferred<string>();
    const request = jest
      .fn<Promise<string>, []>()
      .mockResolvedValueOnce('cached')
      .mockReturnValueOnce(refresh.promise);
    const api = requestsFactory({
      request,
      stateRequestKey: 'config-stale-refresh-response',
      staleTime: 0,
    });

    await store.dispatch(api.loadDataAction());
    const refreshPromise = store.dispatch(api.loadDataAction());

    expect(api.isLoadingSelector(store.getState())).toBe(true);
    expect(api.responseSelector(store.getState())).toBe('cached');

    refresh.resolve('fresh');
    await refreshPromise;
    expect(api.responseSelector(store.getState())).toBe('fresh');
  });

  it('reloads hydrated legacy success state without fulfilledAt for finite staleTime', async () => {
    const { store } = createRequestsTestStore();
    const request = jest.fn(() => Promise.resolve('fresh'));
    const api = requestsFactory({
      request,
      stateRequestKey: 'config-legacy-stale-state',
      staleTime: 100,
    });

    const dispatchPlainAction = store.dispatch as unknown as Dispatch;
    dispatchPlainAction(
      hydrateRequestsAction({
        global_loading: { count: 0 },
        responses: {
          'config-legacy-stale-state': {
            status: RequestsStatuses.Success,
            response: 'legacy',
          },
        },
      })
    );
    await store.dispatch(api.loadDataAction());

    expect(request).toHaveBeenCalledTimes(1);
    expect(api.responseSelector(store.getState())).toBe('fresh');
  });

  it('does not start work for hydrated loading state without a runtime promise', async () => {
    const { store } = createRequestsTestStore();
    const request = jest.fn(() => Promise.resolve('unexpected'));
    const api = requestsFactory({
      request,
      stateRequestKey: 'config-hydrated-loading-state',
      staleTime: 0,
    });
    const dispatchPlainAction = store.dispatch as unknown as Dispatch;

    dispatchPlainAction(
      hydrateRequestsAction({
        global_loading: { count: 0 },
        responses: {
          'config-hydrated-loading-state': {
            status: RequestsStatuses.Loading,
          },
        },
      })
    );
    await store.dispatch(api.loadDataAction());

    expect(request).not.toHaveBeenCalled();
    expect(api.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Loading
    );
  });

  it('treats cancellation without an active request as a no-op', async () => {
    const { store } = createRequestsTestStore();
    const api = requestsFactory({
      request: () => Promise.resolve('response'),
      stateRequestKey: 'config-inactive-cancel',
    });

    await store.dispatch(api.cancelRequestAction());

    expect(api.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.None
    );
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);
  });

  it('uses JSON.stringify as the default debounce key serializer', async () => {
    jest.useFakeTimers();
    const { store } = createRequestsTestStore();
    const request = jest.fn(({ id }: { id: number }) => Promise.resolve(id));
    const api = requestsFactory({
      request,
      stateRequestKey: 'config-default-debounce-key',
      useDebounce: true,
      debounceWait: 100,
    });

    await Promise.all([
      store.dispatch(api.forcedLoadDataAction({ id: 1 })),
      store.dispatch(api.forcedLoadDataAction({ id: 1 })),
    ]);

    expect(request).toHaveBeenCalledTimes(1);
  });

  it('honors trailing debounceOptions and maxWait', async () => {
    jest.useFakeTimers();
    const { store } = createRequestsTestStore();
    const deferredRequest = createDeferred<number>();
    const request = jest.fn(() => deferredRequest.promise);
    const api = requestsFactory({
      request,
      stateRequestKey: 'config-debounce-options',
      useDebounce: true,
      debounceWait: 100,
      debounceOptions: {
        leading: false,
        trailing: true,
        maxWait: 100,
      },
    });

    const firstDispatch = store.dispatch(api.forcedLoadDataAction({ id: 1 }));
    let firstDispatchSettled = false;
    void firstDispatch.then(() => {
      firstDispatchSettled = true;
    });
    await Promise.resolve();

    expect(request).not.toHaveBeenCalled();
    expect(firstDispatchSettled).toBe(false);

    jest.advanceTimersByTime(50);
    const secondDispatch = store.dispatch(api.forcedLoadDataAction({ id: 1 }));
    expect(request).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(request).toHaveBeenCalledTimes(1);
    expect(api.isLoadingSelector(store.getState())).toBe(true);
    expect(firstDispatchSettled).toBe(false);

    deferredRequest.resolve(1);
    await Promise.all([firstDispatch, secondDispatch]);
    expect(firstDispatchSettled).toBe(true);
    expect(api.responseSelector(store.getState())).toBe(1);
  });

  it('uses the documented 500ms debounce defaults', async () => {
    jest.useFakeTimers();
    const { store } = createRequestsTestStore();
    const request = jest.fn(() => Promise.resolve('response'));
    const api = requestsFactory({
      request,
      stateRequestKey: 'config-default-debounce-wait',
      useDebounce: true,
    });

    await store.dispatch(api.forcedLoadDataAction());
    jest.advanceTimersByTime(499);
    await store.dispatch(api.forcedLoadDataAction());
    expect(request).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);
    await store.dispatch(api.forcedLoadDataAction());
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('generates request-specific lifecycle action types from stateRequestKey', () => {
    const api = requestsFactory({
      request: () => Promise.resolve('response'),
      stateRequestKey: 'config-lifecycle-types',
    });

    expect(api.requestFulfilledAction.type).toBe(
      `${FactoryActionTypes.RequestFulfilled}/config-lifecycle-types`
    );
    expect(api.requestRejectedAction.type).toBe(
      `${FactoryActionTypes.RequestRejected}/config-lifecycle-types`
    );
  });
});
