import { isSomethingLoadingSelector } from '../../src';
import {
  DEFAULT_STATE_REQUESTS_KEY,
  IS_SOMETHING_LOADING_STATE_KEY,
  RESPONSES_STATE_KEY,
} from '../../src/constants';

describe('isSomethingLoadingSelector', () => {
  it('when count equal 0', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 0,
        },
        [RESPONSES_STATE_KEY]: {},
      },
    };

    expect(isSomethingLoadingSelector(state)).toBe(false);
  });

  it('when count not equal 0', () => {
    const state = {
      [DEFAULT_STATE_REQUESTS_KEY]: {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: 1,
        },
        [RESPONSES_STATE_KEY]: {},
      },
    };

    expect(isSomethingLoadingSelector(state)).toBe(true);
  });
});
