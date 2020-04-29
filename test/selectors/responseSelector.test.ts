import { requestsFactory, RequestsStatuses } from '../../src';
import {
  DEFAULT_STATE_REQUESTS_KEY,
  IS_SOMETHING_LOADING_STATE_KEY,
  RESPONSES_STATE_KEY,
} from '../../src/constants';

jest.mock('../../src/create-register-request-key', () => () => ({
  registerRequestKey: (key: string) => key,
}));

describe('responseSelector', () => {
  it('when request status is Success', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 0,
        },
        [RESPONSES_STATE_KEY]: {
          users: {
            status: RequestsStatuses.Success,
            response: ['test'],
          },
        },
      },
    };

    const { responseSelector } = requestsFactory({
      request: () => Promise.resolve([]),
      stateRequestKey: 'users',
    });

    expect(responseSelector(state)).toEqual(['test']);
  });

  it('when request status is not Success', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 0,
        },
        [RESPONSES_STATE_KEY]: {
          users: {
            status: RequestsStatuses.Loading,
          },
        },
      },
    };

    const { responseSelector } = requestsFactory({
      request: () => Promise.resolve([]),
      stateRequestKey: 'users',
    });

    expect(responseSelector(state)).toBe(undefined);
  });

  it('when request is not started', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 0,
        },
        [RESPONSES_STATE_KEY]: {},
      },
    };

    const { responseSelector } = requestsFactory({
      request: () => Promise.resolve([]),
      stateRequestKey: 'users',
    });

    expect(responseSelector(state)).toBe(undefined);
  });

  it('with transformResponse when request status is not Success', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 0,
        },
        [RESPONSES_STATE_KEY]: {
          users: {
            status: RequestsStatuses.Loading,
          },
        },
      },
    };

    const { responseSelector } = requestsFactory({
      request: () => Promise.resolve([]),
      stateRequestKey: 'users',
      transformResponse: (response: any) => response || [],
    });

    expect(responseSelector(state)).toEqual([]);
  });

  it('with transformResponse when request status is Success', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 0,
        },
        [RESPONSES_STATE_KEY]: {
          users: {
            status: RequestsStatuses.Success,
            response: ['test'],
          },
        },
      },
    };

    const { responseSelector } = requestsFactory({
      request: (): Promise<string[]> => Promise.resolve([]),
      stateRequestKey: 'users',
      transformResponse: (response?: string[]) =>
        (response || []).map(value => ({ value })),
    });

    expect(responseSelector(state)).toEqual([{ value: 'test' }]);
  });
});
