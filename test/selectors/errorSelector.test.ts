import { requestsFactory, RequestsStatuses } from '../../src';
import {
  DEFAULT_STATE_REQUESTS_KEY,
  IS_SOMETHING_LOADING_STATE_KEY,
  RESPONSES_STATE_KEY,
} from '../../src/constants';

jest.mock('../../src/create-register-request-key', () => () => ({
  registerRequestKey: (key: string) => key,
}));

describe('errorSelector', () => {
  it('when request status is Failed', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 0,
        },
        [RESPONSES_STATE_KEY]: {
          users: {
            status: RequestsStatuses.Failed,
            error: 'Error',
          },
        },
      },
    };

    const { errorSelector } = requestsFactory({
      request: () => Promise.reject([]),
      stateRequestKey: 'users',
    });

    expect(errorSelector(state)).toBe('Error');
  });

  it('when request status is not Failed', () => {
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

    const { errorSelector } = requestsFactory({
      request: () => Promise.reject([]),
      stateRequestKey: 'users',
    });

    expect(errorSelector(state)).toBe(undefined);
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

    const { errorSelector } = requestsFactory({
      request: () => Promise.reject([]),
      stateRequestKey: 'users',
    });

    expect(errorSelector(state)).toBe(undefined);
  });

  it('with transformError when request status is Failed', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 0,
        },
        [RESPONSES_STATE_KEY]: {
          users: {
            status: RequestsStatuses.Failed,
            error: ['Error_1', 'Error_2', 'Error_3'],
          },
        },
      },
    };

    const { errorSelector } = requestsFactory({
      request: () => Promise.reject([]),
      stateRequestKey: 'users',
      transformError: (error?: string[]) => error && error.join(', '),
    });

    expect(errorSelector(state)).toBe('Error_1, Error_2, Error_3');
  });

  it('with transformError when request status is not Failed', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 0,
        },
        [RESPONSES_STATE_KEY]: {
          users: {
            status: RequestsStatuses.Success,
          },
        },
      },
    };

    const { errorSelector } = requestsFactory({
      request: () => Promise.reject([]),
      stateRequestKey: 'users',
      transformError: (error?: string[]) => error && error.join(', '),
    });

    expect(errorSelector(state)).toBe(undefined);
  });
});
