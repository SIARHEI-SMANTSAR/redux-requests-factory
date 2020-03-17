import {
  PreparedConfig,
  CommonActionTypes,
  RequestsState,
  RequestsStatuses,
  RequestActionMeta,
  RequestState,
  RequestsReducer,
} from './types';

const getNewState = (
  state: RequestsState,
  { key, serializedKey }: RequestActionMeta,
  data: RequestState
): RequestsState => ({
  ...state,
  [key]: {
    ...state[key],
    ...(serializedKey
      ? {
          [serializedKey]: {
            ...state[serializedKey],
            ...data,
          },
        }
      : data),
  },
});

export const createRequestsReducer = (
  _config: PreparedConfig
): RequestsReducer => (state = {}, action) => {
  switch (action.type) {
    case CommonActionTypes.CommonRequestStart:
      return getNewState(state, action.meta, {
        status: RequestsStatuses.Loading,
      });
    case CommonActionTypes.CommonRequestSuccess:
      return getNewState(state, action.meta, {
        status: RequestsStatuses.Success,
        response: action.payload.response,
      });
    case CommonActionTypes.CommonRequestError:
      return getNewState(state, action.meta, {
        status: RequestsStatuses.Failed,
        error: action.payload.error,
      });
    case CommonActionTypes.CommonRequestCancel:
      return getNewState(state, action.meta, {
        status: RequestsStatuses.Canceled,
      });
    case CommonActionTypes.CommonRequestReset:
      return getNewState(state, action.meta, {
        status: RequestsStatuses.None,
        response: null,
        error: null,
      });

    default:
      return state;
  }
};
