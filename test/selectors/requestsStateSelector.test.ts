import createReduxRequestsFactory, {
  requestsStateSelector,
  RequestsState,
} from '../../src';
import {
  DEFAULT_STATE_REQUESTS_KEY,
  IS_SOMETHING_LOADING_STATE_KEY,
  RESPONSES_STATE_KEY,
} from '../../src/constants';

const requestsState: RequestsState = {
  [IS_SOMETHING_LOADING_STATE_KEY]: { count: 0 },
  [RESPONSES_STATE_KEY]: {},
};

describe('requestsStateSelector', () => {
  it('selects the default requests state', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: requestsState,
      other: true,
    };

    expect(requestsStateSelector(state)).toBe(requestsState);
  });

  it('uses the configured state requests key', () => {
    const { requestsStateSelector: apiRequestsStateSelector } =
      createReduxRequestsFactory({ stateRequestsKey: 'api' });

    expect(apiRequestsStateSelector({ api: requestsState })).toBe(
      requestsState
    );
  });
});
