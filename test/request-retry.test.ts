import {
  CommonActionTypes,
  GlobalActionTypes,
  RequestsStatuses,
  isSomethingLoadingSelector,
  requestsFactory,
} from '../src';
import { createDeferred, createRequestsTestStore } from './helpers';

const actionsByType = (recordedActions: { type: unknown }[], type: string) =>
  recordedActions.filter((action) => action.type === type);

describe('automatic request retries', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('retries within one lifecycle and exposes only the final success', async () => {
    const { recordedActions, store } = createRequestsTestStore();
    const request = jest
      .fn<Promise<string>, [{ id: number }]>()
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('second'))
      .mockResolvedValueOnce('response');
    const rejectedAction = jest.fn(() => ({ type: 'REJECTED_SIDE_EFFECT' }));
    const shouldRetry = jest.fn(() => true);
    const api = requestsFactory({
      request,
      stateRequestKey: 'retry-until-success',
      transformError: (error: unknown) =>
        error instanceof Error ? error.message : 'unknown',
      retry: {
        maxRetries: 2,
        shouldRetry,
      },
      rejectedActions: [rejectedAction],
    });
    const rejectedType = api.requestRejectedAction.type;

    await store.dispatch(api.loadDataAction({ id: 7 }));

    expect(request).toHaveBeenCalledTimes(3);
    expect(shouldRetry).toHaveBeenNthCalledWith(1, {
      error: 'first',
      params: { id: 7 },
      attempt: 1,
      retriesLeft: 2,
    });
    expect(shouldRetry).toHaveBeenNthCalledWith(2, {
      error: 'second',
      params: { id: 7 },
      attempt: 2,
      retriesLeft: 1,
    });
    expect(rejectedAction).not.toHaveBeenCalled();
    expect(actionsByType(recordedActions, rejectedType)).toHaveLength(0);
    expect(
      actionsByType(recordedActions, CommonActionTypes.RequestStart)
    ).toHaveLength(1);
    expect(
      actionsByType(recordedActions, CommonActionTypes.RequestError)
    ).toHaveLength(0);
    expect(
      actionsByType(recordedActions, CommonActionTypes.RequestSuccess)
    ).toHaveLength(1);
    expect(
      actionsByType(recordedActions, GlobalActionTypes.LoadingIncrement)
    ).toHaveLength(1);
    expect(
      actionsByType(recordedActions, GlobalActionTypes.LoadingDecrement)
    ).toHaveLength(1);
    expect(api.responseSelector(store.getState())).toBe('response');
  });

  it('stores and publishes only the last error after retries are exhausted', async () => {
    const { recordedActions, store } = createRequestsTestStore();
    const errors = [new Error('first'), new Error('second'), new Error('last')];
    const request = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(errors[0])
      .mockRejectedValueOnce(errors[1])
      .mockRejectedValueOnce(errors[2]);
    const rejectedAction = jest.fn(() => ({ type: 'REJECTED_SIDE_EFFECT' }));
    const api = requestsFactory({
      request,
      stateRequestKey: 'retry-exhausted',
      retry: { maxRetries: 2 },
      rejectedActions: [rejectedAction],
    });
    const rejectedType = api.requestRejectedAction.type;

    await store.dispatch(api.loadDataAction());

    expect(request).toHaveBeenCalledTimes(3);
    expect(api.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Failed
    );
    expect(api.errorSelector(store.getState())).toBe(errors[2]);
    expect(rejectedAction).toHaveBeenCalledTimes(1);
    expect(rejectedAction).toHaveBeenCalledWith(
      expect.objectContaining({ error: errors[2] })
    );
    expect(actionsByType(recordedActions, rejectedType)).toHaveLength(1);
    expect(
      actionsByType(recordedActions, CommonActionTypes.RequestError)
    ).toHaveLength(1);
  });

  it('stops immediately when shouldRetry rejects the error', async () => {
    const { store } = createRequestsTestStore();
    const request = jest.fn(() => Promise.reject(new Error('invalid input')));
    const shouldRetry = jest.fn(() => false);
    const api = requestsFactory({
      request,
      stateRequestKey: 'retry-filtered',
      retry: {
        maxRetries: 3,
        shouldRetry,
      },
    });

    await store.dispatch(api.loadDataAction());

    expect(request).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledTimes(1);
    expect(api.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Failed
    );
  });

  it('waits for a computed delay before retrying', async () => {
    jest.useFakeTimers();
    const { store } = createRequestsTestStore();
    const request = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce('response');
    const delay = jest.fn(({ attempt }: { attempt: number }) => attempt * 100);
    const api = requestsFactory({
      request,
      stateRequestKey: 'retry-delay',
      retry: {
        maxRetries: 1,
        delay,
      },
    });

    const requestPromise = store.dispatch(api.loadDataAction());
    await jest.advanceTimersByTimeAsync(99);
    expect(request).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    await requestPromise;

    expect(delay).toHaveBeenCalledWith(
      expect.objectContaining({ attempt: 1, retriesLeft: 1 })
    );
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('cancels a pending retry delay without starting another attempt', async () => {
    jest.useFakeTimers();
    const { store } = createRequestsTestStore();
    const request = jest.fn(() => Promise.reject(new Error('temporary')));
    const api = requestsFactory({
      request,
      stateRequestKey: 'retry-delay-cancel',
      retry: {
        maxRetries: 2,
        delay: 1_000,
      },
    });

    const requestPromise = store.dispatch(api.loadDataAction());
    await jest.advanceTimersByTimeAsync(0);
    expect(jest.getTimerCount()).toBe(1);

    await store.dispatch(api.cancelRequestAction());
    await requestPromise;

    expect(api.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Canceled
    );
    expect(jest.getTimerCount()).toBe(0);

    await jest.advanceTimersByTimeAsync(1_000);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('aborts an active retry attempt without starting another retry', async () => {
    const { store } = createRequestsTestStore();
    const retryStarted = createDeferred<void>();
    let retrySignal: AbortSignal | undefined;
    const request = jest.fn(
      (_params: undefined, { signal }: { signal?: AbortSignal }) => {
        if (request.mock.calls.length === 1) {
          return Promise.reject(new Error('temporary'));
        }

        retrySignal = signal;
        retryStarted.resolve();

        return new Promise<string>((_resolve, reject) => {
          signal?.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        });
      }
    );
    const api = requestsFactory({
      request,
      stateRequestKey: 'active-retry-cancel',
      retry: {
        maxRetries: 2,
      },
    });

    const requestPromise = store.dispatch(api.loadDataAction());
    await retryStarted.promise;
    await store.dispatch(api.cancelRequestAction());
    await requestPromise;

    expect(retrySignal?.aborted).toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
    expect(api.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Canceled
    );
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);

    await Promise.resolve();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('cancelAllRequests clears a pending retry delay', async () => {
    jest.useFakeTimers();
    const { cancelAllRequests, store } = createRequestsTestStore();
    const request = jest.fn(() => Promise.reject(new Error('temporary')));
    const api = requestsFactory({
      request,
      stateRequestKey: 'retry-delay-cancel-all',
      retry: {
        maxRetries: 2,
        delay: 1_000,
      },
    });

    const requestPromise = store.dispatch(api.loadDataAction());
    await jest.advanceTimersByTimeAsync(0);
    expect(jest.getTimerCount()).toBe(1);

    await cancelAllRequests();
    await requestPromise;

    expect(api.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Canceled
    );
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);
    expect(jest.getTimerCount()).toBe(0);

    await jest.advanceTimersByTimeAsync(1_000);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('finishes the Redux lifecycle when a retry policy callback throws', async () => {
    const { store } = createRequestsTestStore();
    const requestError = new Error('request failed');
    const policyError = new Error('invalid retry policy');
    const api = requestsFactory({
      request: () => Promise.reject(requestError),
      stateRequestKey: 'retry-policy-error',
      retry: {
        maxRetries: 1,
        shouldRetry: () => {
          throw policyError;
        },
      },
    });

    await expect(store.dispatch(api.loadDataAction())).rejects.toBe(
      policyError
    );

    expect(api.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Failed
    );
    expect(api.errorSelector(store.getState())).toBe(requestError);
    expect(isSomethingLoadingSelector(store.getState())).toBe(false);
  });
});
