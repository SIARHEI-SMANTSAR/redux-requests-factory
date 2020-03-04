import { Reducer } from 'redux';

import {
  PreparedConfig,
  CommonActions,
  CommonActionTypes,
  RequestsState,
  RequestsStatuses,
  CommonRequestActionMeta,
  RequestState,
} from './types';

const getNewState = (
  state: RequestsState,
  { key, serializedKey }: CommonRequestActionMeta,
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

export const createRequestsReducer = ({}: PreparedConfig): Reducer<
  RequestsState,
  CommonActions
> => (state = {}, action) => {
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
        response: action.payload.error,
      });
    case CommonActionTypes.CommonRequestCancel:
      return getNewState(state, action.meta, {
        status: RequestsStatuses.Canceled,
      });

    default:
      return state;
  }
};
