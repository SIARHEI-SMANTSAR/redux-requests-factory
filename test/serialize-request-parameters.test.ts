import { requestsFactory, RequestsStatuses } from '../src';
import {
  DEFAULT_STATE_REQUESTS_KEY,
  IS_SOMETHING_LOADING_STATE_KEY,
  RESPONSES_STATE_KEY,
} from '../src/constants';

jest.mock('../src/factory/register-request-key', () => (key: string) => key);

describe('serializeRequestParameters', () => {
  it('selectors shuld return functions', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 0,
        },
        [RESPONSES_STATE_KEY]: {
          user: {
            '25': {
              status: RequestsStatuses.Success,
              response: ['test'],
              error: 'Error',
            },
          },
        },
      },
    };

    const {
      responseSelector,
      errorSelector,
      requestStatusSelector,
      isLoadingSelector,
      isLoadedSelector,
    } = requestsFactory({
      request: (_params: { id: string }) => Promise.resolve([]),
      stateRequestKey: 'user',
      serializeRequestParameters: ({ id }: { id: string }) => id,
    });

    expect(responseSelector(state)({ id: '25' })).toEqual(['test']);
    expect(errorSelector(state)({ id: '25' })).toBe('Error');
    expect(requestStatusSelector(state)({ id: '25' })).toBe(
      RequestsStatuses.Success
    );
    expect(isLoadingSelector(state)({ id: '25' })).toBe(false);
    expect(isLoadedSelector(state)({ id: '25' })).toBe(true);
  });
});
