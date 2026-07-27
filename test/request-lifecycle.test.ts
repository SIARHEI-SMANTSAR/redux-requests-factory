import { FactoryActionTypes, RequestsStatuses, requestsFactory } from '../src';
import { createRequestsTestStore } from './helpers';

const actionsByType = (recordedActions: { type: unknown }[], type: string) =>
  recordedActions.filter((action) => action.type === type);

describe('request lifecycle actions and side effects', () => {
  it('does not dispatch lazy lifecycle actions before their creators are read', async () => {
    const { recordedActions, store } = createRequestsTestStore();
    const api = requestsFactory({
      request: jest.fn().mockResolvedValue('response'),
      stateRequestKey: 'lazy-disabled',
    });

    await store.dispatch(api.loadDataAction());

    expect(
      actionsByType(
        recordedActions,
        `${FactoryActionTypes.RequestFulfilled}/lazy-disabled`
      )
    ).toHaveLength(0);
    expect(
      actionsByType(
        recordedActions,
        `${FactoryActionTypes.RequestRejected}/lazy-disabled`
      )
    ).toHaveLength(0);
  });

  it('enables only the lifecycle action creator that was read', async () => {
    const { recordedActions, store } = createRequestsTestStore();
    const error = new Error('failed');
    const request = jest
      .fn<Promise<string>, []>()
      .mockResolvedValueOnce('response')
      .mockRejectedValueOnce(error);
    const api = requestsFactory({
      request,
      stateRequestKey: 'one-lazy-action',
    });
    const fulfilledType = api.requestFulfilledAction.type;
    const rejectedType = `${FactoryActionTypes.RequestRejected}/one-lazy-action`;

    await store.dispatch(api.loadDataAction());
    await store.dispatch(api.forcedLoadDataAction());

    expect(actionsByType(recordedActions, fulfilledType)).toHaveLength(1);
    expect(actionsByType(recordedActions, rejectedType)).toHaveLength(0);
    expect(api.requestStatusSelector(store.getState())).toBe(
      RequestsStatuses.Failed
    );
  });

  it('dispatches transformed errors through an enabled rejected action', async () => {
    const { recordedActions, store } = createRequestsTestStore();
    const api = requestsFactory({
      request: () => Promise.reject(new Error('network error')),
      stateRequestKey: 'transformed-rejection',
      transformError: (error: unknown) =>
        error instanceof Error ? error.message : 'unknown',
    });
    const rejectedType = api.requestRejectedAction.type;

    await store.dispatch(api.loadDataAction());

    expect(actionsByType(recordedActions, rejectedType)).toEqual([
      expect.objectContaining({
        payload: { error: 'network error', params: undefined },
      }),
    ]);
  });

  it('emits enabled lifecycle actions for manual response and error updates', async () => {
    const { recordedActions, store } = createRequestsTestStore();
    const api = requestsFactory({
      request: jest.fn().mockResolvedValue('unused'),
      stateRequestKey: 'manual-state',
    });
    const fulfilledType = api.requestFulfilledAction.type;
    const rejectedType = api.requestRejectedAction.type;

    await store.dispatch(
      api.setResponseAction({ response: 'manual response' })
    );
    await store.dispatch(api.setErrorAction({ error: 'manual error' }));

    expect(actionsByType(recordedActions, fulfilledType)).toEqual([
      expect.objectContaining({
        payload: { params: undefined, response: 'manual response' },
      }),
    ]);
    expect(actionsByType(recordedActions, rejectedType)).toEqual([
      expect.objectContaining({
        payload: { error: 'manual error', params: undefined },
      }),
    ]);
    expect(api.errorSelector(store.getState())).toBe('manual error');
  });

  it('re-dispatches enabled fulfilled side effects for a cached load', async () => {
    const { recordedActions, store } = createRequestsTestStore();
    const request = jest.fn().mockResolvedValue('cached response');
    const fulfilledSideEffect = jest.fn(() => ({
      type: 'CACHED_FULFILLED_SIDE_EFFECT',
    }));
    const api = requestsFactory({
      request,
      stateRequestKey: 'cached-fulfilled',
      dispatchFulfilledActionForLoadedRequest: true,
      fulfilledActions: [fulfilledSideEffect],
    });
    const fulfilledType = api.requestFulfilledAction.type;

    await store.dispatch(api.loadDataAction());
    await store.dispatch(api.loadDataAction());

    expect(request).toHaveBeenCalledTimes(1);
    expect(fulfilledSideEffect).toHaveBeenCalledTimes(2);
    expect(actionsByType(recordedActions, fulfilledType)).toHaveLength(2);
    expect(
      actionsByType(recordedActions, 'CACHED_FULFILLED_SIDE_EFFECT')
    ).toHaveLength(2);
  });

  it('supports static, factory, array, and null external actions', async () => {
    const { recordedActions, store } = createRequestsTestStore();
    const fulfilledFactory = jest.fn((_data: unknown) => ({
      type: 'FULFILLED_FACTORY',
    }));
    const rejectedFactory = jest.fn((_data: unknown) => [
      { type: 'REJECTED_FACTORY_ARRAY' },
      null,
    ]);
    const request = jest
      .fn<Promise<string>, []>()
      .mockResolvedValueOnce('response')
      .mockRejectedValueOnce(new Error('failure'));
    const api = requestsFactory({
      request,
      stateRequestKey: 'external-actions',
      fulfilledActions: [
        null,
        { type: 'FULFILLED_STATIC' },
        [{ type: 'FULFILLED_ARRAY' }, null],
        fulfilledFactory,
      ],
      rejectedActions: [
        null,
        { type: 'REJECTED_STATIC' },
        [{ type: 'REJECTED_ARRAY' }, null],
        rejectedFactory,
      ],
    });

    await store.dispatch(api.loadDataAction());
    await store.dispatch(api.forcedLoadDataAction());

    expect(fulfilledFactory).toHaveBeenCalledWith(
      expect.objectContaining({ request: undefined, response: 'response' })
    );
    expect(rejectedFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        request: undefined,
      })
    );
    expect(
      recordedActions
        .map(({ type }) => type)
        .filter((type) => String(type).startsWith('FULFILLED_'))
    ).toEqual(['FULFILLED_STATIC', 'FULFILLED_ARRAY', 'FULFILLED_FACTORY']);
    expect(
      recordedActions
        .map(({ type }) => type)
        .filter((type) => String(type).startsWith('REJECTED_'))
    ).toEqual(['REJECTED_STATIC', 'REJECTED_ARRAY', 'REJECTED_FACTORY_ARRAY']);
  });
});
