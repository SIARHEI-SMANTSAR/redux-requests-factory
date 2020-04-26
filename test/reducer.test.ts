import {
  requestsReducer,
  CommonActionTypes,
  RequestsStatuses,
  RequestsState,
  GlobalActionTypes,
  Actions,
} from '../src';
import {
  IS_SOMETHING_LOADING_STATE_KEY,
  RESPONSES_STATE_KEY,
} from '../src/constants';

describe('requestsReducer responses', () => {
  let state: RequestsState;

  beforeEach(() => {
    state = {
      [IS_SOMETHING_LOADING_STATE_KEY]: {
        count: 0,
      },
      [RESPONSES_STATE_KEY]: {
        post: {
          status: RequestsStatuses.Failed,
          error: 'error',
        },
      },
    };
  });

  test.each([
    [
      // action
      {
        type: CommonActionTypes.RequestStart,
        meta: {
          key: 'users',
        },
      },
      // expected state
      {
        users: {
          status: RequestsStatuses.Loading,
        },
        post: {
          status: RequestsStatuses.Failed,
          error: 'error',
        },
      },
    ],
    [
      // action
      {
        type: CommonActionTypes.RequestSuccess,
        meta: {
          key: 'users',
        },
        payload: { response: ['test'] },
      },
      // expected state
      {
        users: {
          status: RequestsStatuses.Success,
          response: ['test'],
        },
        post: {
          status: RequestsStatuses.Failed,
          error: 'error',
        },
      },
    ],
    [
      // action
      {
        type: CommonActionTypes.RequestError,
        meta: {
          key: 'users',
        },
        payload: { error: 'error' },
      },
      // expected state
      {
        users: {
          status: RequestsStatuses.Failed,
          error: 'error',
        },
        post: {
          status: RequestsStatuses.Failed,
          error: 'error',
        },
      },
    ],
    [
      // action
      {
        type: CommonActionTypes.RequestCancel,
        meta: {
          key: 'posts',
        },
      },
      // expected state
      {
        posts: {
          status: RequestsStatuses.Canceled,
        },
        post: {
          status: RequestsStatuses.Failed,
          error: 'error',
        },
      },
    ],
    [
      // action
      {
        type: CommonActionTypes.RequestReset,
        meta: {
          key: 'post',
        },
      },
      // expected state
      {
        post: {
          status: RequestsStatuses.None,
          response: undefined,
          error: undefined,
        },
      },
    ],
    [
      // action
      {
        type: CommonActionTypes.RequestSuccess,
        meta: {
          key: 'post',
        },
        payload: { response: ['test'] },
      },
      // expected state
      {
        post: {
          status: RequestsStatuses.Success,
          response: ['test'],
          error: undefined,
        },
      },
    ],
    [
      // action
      {
        type: CommonActionTypes.RequestStart,
        meta: {
          key: 'user',
          serializedKey: '25',
        },
      },
      // expected state
      {
        user: {
          '25': {
            status: RequestsStatuses.Loading,
          },
        },
        post: {
          status: RequestsStatuses.Failed,
          error: 'error',
        },
      },
    ],
  ])('action: %o, expected: %o', (action, expected) => {
    const newState = requestsReducer(state, action as Actions);

    expect(newState[RESPONSES_STATE_KEY]).toEqual(expected);
  });
});

describe('requestsReducer is something loading', () => {
  test.each([
    [0, { type: GlobalActionTypes.LoadingIncrement }, 1],
    [1, { type: GlobalActionTypes.LoadingDecrement }, 0],
  ])(
    'countBefore: %n, action: %0, countAfter: %n',
    (countBefore, action, countAfter) => {
      const state = {
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          count: countBefore,
        },
        [RESPONSES_STATE_KEY]: {},
      };
      const newState = requestsReducer(state, action as Actions);

      expect(newState[IS_SOMETHING_LOADING_STATE_KEY].count).toEqual(
        countAfter
      );
    }
  );
});
