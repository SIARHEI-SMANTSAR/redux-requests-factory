import {
  RequestsStatuses,
  requestsFactory,
  requestsStateSelector,
  type RequestState,
} from '../src';
import { RESPONSES_STATE_KEY } from '../src/constants';
import { createDeferred, createRequestsTestStore } from './helpers';

type CommandAction = {
  forwardFactoryAction?: boolean;
  meta: { key: string; serializedKey?: string };
  payload?: unknown;
  toJSON(): string;
  toObject(): unknown;
  toString(): string;
  type: string;
};

const expectCommandContract = (
  creator: {
    getType(): string;
    toString(): string;
    type: string;
  },
  action: CommandAction,
  expected: {
    forwardFactoryAction?: boolean;
    meta: { key: string; serializedKey?: string };
    payload?: unknown;
  }
) => {
  expect(creator.getType()).toBe(creator.type);
  expect(creator.toString()).toBe(creator.type);
  expect(action.type).toBe(creator.type);
  expect(action.meta).toEqual(expected.meta);
  expect(action.payload).toEqual(expected.payload);
  expect(action.forwardFactoryAction).toBe(expected.forwardFactoryAction);
  expect(action.toObject()).toEqual({
    type: creator.type,
    meta: expected.meta,
    payload: expected.payload,
  });
  expect(JSON.parse(action.toString())).toEqual(action.toObject());
  expect(JSON.parse(action.toJSON())).toEqual(action.toObject());
};

describe('requestsFactory public contract', () => {
  it('returns every documented action creator and selector', () => {
    const api = requestsFactory({
      request: () => Promise.resolve('response'),
      stateRequestKey: 'contract-surface',
    });

    expect(Object.keys(api).sort()).toEqual(
      [
        'cancelRequestAction',
        'doRequestAction',
        'errorSelector',
        'forcedLoadDataAction',
        'isLoadedSelector',
        'isLoadingSelector',
        'loadDataAction',
        'requestFulfilledAction',
        'requestRejectedAction',
        'requestStatusSelector',
        'resetRequestAction',
        'responseSelector',
        'setErrorAction',
        'setResponseAction',
      ].sort()
    );

    Object.values(api).forEach((value) => {
      expect(typeof value).toBe('function');
    });
  });

  it('exposes a consistent command action shape without serialized params', () => {
    const api = requestsFactory<string, string, { id: number }, any>({
      request: ({ id }: { id: number }) => Promise.resolve(`response-${id}`),
      stateRequestKey: 'contract-plain-actions',
    });
    const params = { id: 7 };

    [
      api.doRequestAction,
      api.forcedLoadDataAction,
      api.loadDataAction,
      api.cancelRequestAction,
    ].forEach((creator) => {
      expectCommandContract(
        creator,
        creator(params, { forwardFactoryAction: true }),
        {
          forwardFactoryAction: true,
          meta: { key: 'contract-plain-actions' },
          payload: params,
        }
      );
    });
  });

  it('serializes optional command values without params', () => {
    const api = requestsFactory({
      request: () => Promise.resolve('response'),
      stateRequestKey: 'contract-optional-actions',
    });
    const action = api.loadDataAction();

    expect(action.meta).toEqual({ key: 'contract-optional-actions' });
    expect(action.payload).toBeUndefined();
    expect(action.toObject()).toEqual({
      type: api.loadDataAction.type,
      meta: { key: 'contract-optional-actions' },
      payload: undefined,
    });
    expect(JSON.parse(action.toJSON())).toEqual({
      type: api.loadDataAction.type,
      meta: { key: 'contract-optional-actions' },
    });
  });

  it('exposes correct command metadata and payloads with serialized params', () => {
    const api = requestsFactory<string, string, { id: number }, any>({
      request: ({ id }: { id: number }) => Promise.resolve(`response-${id}`),
      stateRequestKey: 'contract-serialized-actions',
      serializeRequestParameters: ({ id }: { id: number }) => `user-${id}`,
    });
    const params = { id: 7 };
    const meta = {
      key: 'contract-serialized-actions',
      serializedKey: 'user-7',
    };

    expectCommandContract(api.doRequestAction, api.doRequestAction(params), {
      meta,
      payload: params,
    });
    expectCommandContract(
      api.forcedLoadDataAction,
      api.forcedLoadDataAction(params),
      { meta, payload: params }
    );
    expectCommandContract(api.loadDataAction, api.loadDataAction(params), {
      meta,
      payload: params,
    });
    expectCommandContract(
      api.cancelRequestAction,
      api.cancelRequestAction(params),
      { meta, payload: params }
    );
    expectCommandContract(
      api.setResponseAction,
      api.setResponseAction({ response: 'manual', params }),
      { meta, payload: { response: 'manual', params } }
    );
    expectCommandContract(
      api.setErrorAction,
      api.setErrorAction({ error: 'manual error', params }),
      { meta, payload: { error: 'manual error', params } }
    );
    expectCommandContract(
      api.resetRequestAction,
      api.resetRequestAction(params),
      { meta, payload: params }
    );
  });

  it('exposes lifecycle action creator metadata and action values', () => {
    const api = requestsFactory({
      request: () => Promise.resolve('response'),
      stateRequestKey: 'contract-lifecycle-actions',
    });
    const meta = { key: 'contract-lifecycle-actions' };
    const fulfilledPayload = { params: undefined, response: 'response' };
    const rejectedPayload = { error: 'failed', params: undefined };

    expect(api.requestFulfilledAction.getType()).toBe(
      api.requestFulfilledAction.type
    );
    expect(api.requestFulfilledAction.toString()).toBe(
      api.requestFulfilledAction.type
    );
    expect(api.requestFulfilledAction(fulfilledPayload, meta)).toEqual({
      type: api.requestFulfilledAction.type,
      meta,
      payload: fulfilledPayload,
    });

    expect(api.requestRejectedAction.getType()).toBe(
      api.requestRejectedAction.type
    );
    expect(api.requestRejectedAction.toString()).toBe(
      api.requestRejectedAction.type
    );
    expect(api.requestRejectedAction(rejectedPayload, meta)).toEqual({
      type: api.requestRejectedAction.type,
      meta,
      payload: rejectedPayload,
    });
  });

  it('executes doRequestAction every time without using the success cache', async () => {
    const { store } = createRequestsTestStore();
    const request = jest
      .fn<Promise<string>, []>()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');
    const api = requestsFactory({
      request,
      stateRequestKey: 'contract-do-request',
    });

    await store.dispatch(api.doRequestAction());
    expect(api.responseSelector(store.getState())).toBe('first');

    await store.dispatch(api.doRequestAction());
    expect(api.responseSelector(store.getState())).toBe('second');
    expect(api.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Success
    );
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('keeps all serialized selectors scoped to their parameter key', async () => {
    const { store } = createRequestsTestStore();
    const api = requestsFactory({
      request: ({ id }: { id: number }) =>
        id === 1
          ? Promise.resolve(`response-${id}`)
          : Promise.reject(new Error(`error-${id}`)),
      stateRequestKey: 'contract-serialized-selectors',
      serializeRequestParameters: ({ id }: { id: number }) => `${id}`,
      transformResponse: (response?: string) => response?.toUpperCase(),
      transformError: (error: unknown) =>
        error === undefined
          ? undefined
          : error instanceof Error
            ? error.message
            : 'unknown',
    });

    await store.dispatch(api.loadDataAction({ id: 1 }));
    await store.dispatch(api.loadDataAction({ id: 2 }));

    const response = api.responseSelector(store.getState());
    const error = api.errorSelector(store.getState());
    const status = api.requestStatusSelector(store.getState());
    const isLoading = api.isLoadingSelector(store.getState());
    const isLoaded = api.isLoadedSelector(store.getState());

    expect(response({ id: 1 })).toBe('RESPONSE-1');
    expect(error({ id: 1 })).toBeUndefined();
    expect(status({ id: 1 })).toBe(RequestsStatuses.Success);
    expect(isLoading({ id: 1 })).toBe(false);
    expect(isLoaded({ id: 1 })).toBe(true);

    expect(response({ id: 2 })).toBeUndefined();
    expect(error({ id: 2 })).toBe('error-2');
    expect(status({ id: 2 })).toBe(RequestsStatuses.Failed);
    expect(isLoading({ id: 2 })).toBe(false);
    expect(isLoaded({ id: 2 })).toBe(false);

    expect(response({ id: 3 })).toBeUndefined();
    expect(error({ id: 3 })).toBeUndefined();
    expect(status({ id: 3 })).toBe(RequestsStatuses.None);
    expect(isLoading({ id: 3 })).toBe(false);
    expect(isLoaded({ id: 3 })).toBe(false);
  });
});

describe('requestsFactory public actions Redux state', () => {
  it('stores exact loading and success state for every request command', async () => {
    const { store } = createRequestsTestStore();
    const loadRequest = createDeferred<string>();
    const forcedRequest = createDeferred<string>();
    const directRequest = createDeferred<string>();
    const request = jest
      .fn<Promise<string>, []>()
      .mockReturnValueOnce(loadRequest.promise)
      .mockReturnValueOnce(forcedRequest.promise)
      .mockReturnValueOnce(directRequest.promise);
    const api = requestsFactory({
      request,
      stateRequestKey: 'state-request-commands',
    });
    const storedState = () =>
      requestsStateSelector(store.getState())[RESPONSES_STATE_KEY][
        'state-request-commands'
      ] as RequestState;

    const loadPromise = store.dispatch(api.loadDataAction());
    expect(storedState()).toEqual({ status: RequestsStatuses.Loading });

    loadRequest.resolve('loaded');
    await loadPromise;
    expect(storedState()).toEqual({
      status: RequestsStatuses.Success,
      response: 'loaded',
      error: undefined,
      fulfilledAt: expect.any(Number),
    });

    const firstFulfilledAt = storedState().fulfilledAt;
    const forcedPromise = store.dispatch(api.forcedLoadDataAction());
    expect(storedState()).toEqual({
      status: RequestsStatuses.Loading,
      response: 'loaded',
      error: undefined,
      fulfilledAt: firstFulfilledAt,
    });

    forcedRequest.resolve('forced');
    await forcedPromise;
    expect(storedState()).toEqual({
      status: RequestsStatuses.Success,
      response: 'forced',
      error: undefined,
      fulfilledAt: expect.any(Number),
    });

    const forcedFulfilledAt = storedState().fulfilledAt;
    const directPromise = store.dispatch(api.doRequestAction());
    expect(storedState()).toEqual({
      status: RequestsStatuses.Loading,
      response: 'forced',
      error: undefined,
      fulfilledAt: forcedFulfilledAt,
    });

    directRequest.resolve('direct');
    await directPromise;
    expect(storedState()).toEqual({
      status: RequestsStatuses.Success,
      response: 'direct',
      error: undefined,
      fulfilledAt: expect.any(Number),
    });
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('stores exact manual response, error, and reset state', async () => {
    const { store } = createRequestsTestStore();
    const firstError = new Error('first error');
    const secondError = new Error('second error');
    const api = requestsFactory({
      request: () => Promise.resolve('unused'),
      stateRequestKey: 'state-manual-commands',
    });
    const storedState = () =>
      requestsStateSelector(store.getState())[RESPONSES_STATE_KEY][
        'state-manual-commands'
      ] as RequestState;

    await store.dispatch(api.setErrorAction({ error: firstError }));
    expect(storedState()).toEqual({
      status: RequestsStatuses.Failed,
      error: firstError,
    });

    await store.dispatch(api.setResponseAction({ response: 'manual' }));
    expect(storedState()).toEqual({
      status: RequestsStatuses.Success,
      response: 'manual',
      error: undefined,
      fulfilledAt: expect.any(Number),
    });

    const fulfilledAt = storedState().fulfilledAt;
    await store.dispatch(api.setErrorAction({ error: secondError }));
    expect(storedState()).toEqual({
      status: RequestsStatuses.Failed,
      response: 'manual',
      error: secondError,
      fulfilledAt,
    });

    await store.dispatch(api.resetRequestAction());
    expect(storedState()).toEqual({
      status: RequestsStatuses.None,
      response: undefined,
      error: undefined,
      fulfilledAt: undefined,
    });
  });

  it('changes only status on cancel and preserves the previous request data', async () => {
    const { store } = createRequestsTestStore();
    const request = createDeferred<string>();
    const previousError = new Error('previous error');
    const api = requestsFactory({
      request: () => request.promise,
      stateRequestKey: 'state-cancel-command',
    });
    const storedState = () =>
      requestsStateSelector(store.getState())[RESPONSES_STATE_KEY][
        'state-cancel-command'
      ] as RequestState;

    await store.dispatch(api.setResponseAction({ response: 'previous' }));
    const fulfilledAt = storedState().fulfilledAt;
    await store.dispatch(api.setErrorAction({ error: previousError }));

    const requestPromise = store.dispatch(api.forcedLoadDataAction());
    await store.dispatch(api.cancelRequestAction());
    await requestPromise;

    expect(storedState()).toEqual({
      status: RequestsStatuses.Canceled,
      response: 'previous',
      error: previousError,
      fulfilledAt,
    });

    request.resolve('ignored');
    await Promise.resolve();
    await Promise.resolve();
    expect(storedState()).toEqual({
      status: RequestsStatuses.Canceled,
      response: 'previous',
      error: previousError,
      fulfilledAt,
    });
  });

  it('keeps every state-changing command scoped to its serialized key', async () => {
    const { store } = createRequestsTestStore();
    const request = createDeferred<string>();
    const api = requestsFactory({
      request: () => request.promise,
      stateRequestKey: 'state-serialized-commands',
      serializeRequestParameters: ({ id }: { id: number }) => `${id}`,
    });
    const storedStates = () =>
      requestsStateSelector(store.getState())[RESPONSES_STATE_KEY][
        'state-serialized-commands'
      ] as Record<string, RequestState>;

    await store.dispatch(
      api.setResponseAction({ params: { id: 1 }, response: 'first' })
    );
    await store.dispatch(
      api.setResponseAction({ params: { id: 2 }, response: 'second' })
    );
    const firstFulfilledAt = storedStates()['1'].fulfilledAt;
    const secondFulfilledAt = storedStates()['2'].fulfilledAt;

    await store.dispatch(
      api.setErrorAction({ error: 'first error', params: { id: 1 } })
    );
    expect(storedStates()).toEqual({
      '1': {
        status: RequestsStatuses.Failed,
        response: 'first',
        error: 'first error',
        fulfilledAt: firstFulfilledAt,
      },
      '2': {
        status: RequestsStatuses.Success,
        response: 'second',
        error: undefined,
        fulfilledAt: secondFulfilledAt,
      },
    });

    const requestPromise = store.dispatch(api.forcedLoadDataAction({ id: 2 }));
    await store.dispatch(api.cancelRequestAction({ id: 2 }));
    await requestPromise;

    expect(storedStates()['1'].status).toBe(RequestsStatuses.Failed);
    expect(storedStates()['2']).toEqual({
      status: RequestsStatuses.Canceled,
      response: 'second',
      error: undefined,
      fulfilledAt: secondFulfilledAt,
    });

    await store.dispatch(api.resetRequestAction({ id: 1 }));
    expect(storedStates()['1']).toEqual({
      status: RequestsStatuses.None,
      response: undefined,
      error: undefined,
      fulfilledAt: undefined,
    });
    expect(storedStates()['2'].status).toBe(RequestsStatuses.Canceled);

    request.resolve('ignored');
  });

  it('does not change request state when lifecycle notifications are dispatched', async () => {
    const { store } = createRequestsTestStore();
    const api = requestsFactory({
      request: () => Promise.resolve('unused'),
      stateRequestKey: 'state-lifecycle-notifications',
    });

    await store.dispatch(api.setResponseAction({ response: 'stored' }));
    const before = requestsStateSelector(store.getState());
    const meta = { key: 'state-lifecycle-notifications' };

    store.dispatch(
      api.requestFulfilledAction(
        { params: undefined, response: 'notification response' },
        meta
      )
    );
    store.dispatch(
      api.requestRejectedAction(
        { error: 'notification error', params: undefined },
        meta
      )
    );

    expect(requestsStateSelector(store.getState())).toBe(before);
  });
});
