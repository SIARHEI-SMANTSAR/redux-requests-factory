import { requestsFactory, RequestsStatuses } from '../../src';
import {
  DEFAULT_STATE_REQUESTS_KEY,
  IS_SOMETHING_LOADING_STATE_KEY,
  RESPONSES_STATE_KEY,
} from '../../src/constants';

jest.mock('../../src/factory/register-request-key', () => (key: string) => key);

describe('isLoadingSelector', () => {
  it('when request is not started', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 0,
        },
        [RESPONSES_STATE_KEY]: {},
      },
    };

    const { isLoadingSelector } = requestsFactory({
      request: () => Promise.resolve([]),
      stateRequestKey: 'users',
    });

    expect(isLoadingSelector(state)).toBe(false);
  });

  it('when request is started', () => {
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

    const { isLoadingSelector } = requestsFactory({
      request: () => Promise.resolve([]),
      stateRequestKey: 'users',
    });

    expect(isLoadingSelector(state)).toBe(true);
  });

  it('when request is loaded', () => {
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

    const { isLoadingSelector } = requestsFactory({
      request: () => Promise.resolve([]),
      stateRequestKey: 'users',
    });

    expect(isLoadingSelector(state)).toBe(false);
  });

  it('when request is failed', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 0,
        },
        [RESPONSES_STATE_KEY]: {
          users: {
            status: RequestsStatuses.Failed,
          },
        },
      },
    };

    const { isLoadingSelector } = requestsFactory({
      request: () => Promise.resolve([]),
      stateRequestKey: 'users',
    });

    expect(isLoadingSelector(state)).toBe(false);
  });

  it('when request is canceled', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 0,
        },
        [RESPONSES_STATE_KEY]: {
          users: {
            status: RequestsStatuses.Canceled,
          },
        },
      },
    };

    const { isLoadingSelector } = requestsFactory({
      request: () => Promise.resolve([]),
      stateRequestKey: 'users',
    });

    expect(isLoadingSelector(state)).toBe(false);
  });
});
