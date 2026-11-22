import { requestsFactory, RequestsStatuses } from '../../src';
import {
  DEFAULT_STATE_REQUESTS_KEY,
  IS_SOMETHING_LOADING_STATE_KEY,
  RESPONSES_STATE_KEY,
} from '../../src/constants';

jest.mock('../../src/create-register-request-key', () => () => ({
  registerRequestKey: (key: string) => key,
}));

describe('requestVersionSelector', () => {
  it('returns zero before a request has started', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: { count: 0 },
        [RESPONSES_STATE_KEY]: {},
      },
    };
    const { requestVersionSelector } = requestsFactory({
      request: () => Promise.resolve([]),
      stateRequestKey: 'users',
    });

    expect(requestVersionSelector(state)).toBe(0);
  });

  it('returns the stored execution version', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: { count: 0 },
        [RESPONSES_STATE_KEY]: {
          users: {
            status: RequestsStatuses.Loading,
            requestVersion: 2,
          },
        },
      },
    };
    const { requestVersionSelector } = requestsFactory({
      request: () => Promise.resolve([]),
      stateRequestKey: 'users',
    });

    expect(requestVersionSelector(state)).toBe(2);
  });

  it('reads the version of each serialized key independently', () => {
    const { requestVersionSelector } = requestsFactory({
      request: async (filter: string) => [filter],
      stateRequestKey: 'users-by-filter',
      serializeRequestParameters: (filter: string) => filter,
    });
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: { count: 0 },
        [RESPONSES_STATE_KEY]: {
          'users-by-filter': {
            '': { status: RequestsStatuses.Success, requestVersion: 3 },
            active: { status: RequestsStatuses.Loading, requestVersion: 2 },
            archived: { status: RequestsStatuses.Success },
          },
        },
      },
    };
    const versionFor = requestVersionSelector(state);

    expect(versionFor('')).toBe(3);
    expect(versionFor('active')).toBe(2);
    expect(versionFor('archived')).toBe(0);
    expect(versionFor('missing')).toBe(0);
  });
});
