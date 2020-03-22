import {
  PreparedConfig,
  CommonActionTypes,
  RequestsState,
  RequestsStatuses,
  RequestActionMeta,
  RequestState,
  RequestsReducer,
  GlobalActionTypes,
} from '../types';
import {
  RESPONSES_STATE_KEY,
  IS_SOMETHING_LOADING_STATE_KEY,
} from './constants';

const initialState: RequestsState = {
  [IS_SOMETHING_LOADING_STATE_KEY]: {
    count: 0,
  },
  [RESPONSES_STATE_KEY]: {},
};

const getNewRequestsState = (
  state: RequestsState,
  { key, serializedKey }: RequestActionMeta,
  data: RequestState
): RequestsState => ({
  ...state,
  [RESPONSES_STATE_KEY]: {
    ...state[RESPONSES_STATE_KEY],
    [key]: {
      ...state[RESPONSES_STATE_KEY][key],
      ...(serializedKey
        ? {
            [serializedKey]: {
              ...state[RESPONSES_STATE_KEY][serializedKey],
              ...data,
            },
          }
        : data),
    },
  },
});

export const createRequestsReducer = <Key>(
  _config: PreparedConfig<Key>
): RequestsReducer => (state = initialState, action) => {
  switch (action.type) {
    case CommonActionTypes.RequestStart:
      return getNewRequestsState(state, action.meta, {
        status: RequestsStatuses.Loading,
      });
    case CommonActionTypes.RequestSuccess:
      return getNewRequestsState(state, action.meta, {
        status: RequestsStatuses.Success,
        response: action.payload.response,
      });
    case CommonActionTypes.RequestError:
      return getNewRequestsState(state, action.meta, {
        status: RequestsStatuses.Failed,
        error: action.payload.error,
      });
    case CommonActionTypes.RequestCancel:
      return getNewRequestsState(state, action.meta, {
        status: RequestsStatuses.Canceled,
      });
    case CommonActionTypes.RequestReset:
      return getNewRequestsState(state, action.meta, {
        status: RequestsStatuses.None,
        response: null,
        error: null,
      });
    case GlobalActionTypes.LoadingIncrement:
      return {
        ...state,
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          ...state[IS_SOMETHING_LOADING_STATE_KEY],
          count: state[IS_SOMETHING_LOADING_STATE_KEY].count + 1,
        },
      };
    case GlobalActionTypes.LoadingDecrement:
      return {
        ...state,
        [IS_SOMETHING_LOADING_STATE_KEY]: {
          ...state[IS_SOMETHING_LOADING_STATE_KEY],
          count: state[IS_SOMETHING_LOADING_STATE_KEY].count - 1,
        },
      };

    default:
      return state;
  }
};
