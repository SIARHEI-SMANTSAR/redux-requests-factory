import { requestsFactory, RequestsStatuses } from '../../src';
import {
  DEFAULT_STATE_REQUESTS_KEY,
  IS_SOMETHING_LOADING_STATE_KEY,
  RESPONSES_STATE_KEY,
} from '../../src/constants';

jest.mock('../../src/create-register-request-key', () => () => ({
  registerRequestKey: (key: string) => key,
}));

describe('requestStatusSelector', () => {
  it('when request is not started', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 0,
        },
        [RESPONSES_STATE_KEY]: {},
      },
    };

    const { requestStatusSelector } = requestsFactory({
      request: () => Promise.resolve([]),
      stateRequestKey: 'users',
    });

    expect(requestStatusSelector(state)).toBe(RequestsStatuses.None);
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

    const { requestStatusSelector } = requestsFactory({
      request: () => Promise.resolve([]),
      stateRequestKey: 'users',
    });

    expect(requestStatusSelector(state)).toBe(RequestsStatuses.Loading);
  });
});
