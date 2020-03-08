import {
  CommonRequestStartAction,
  CommonActionTypes,
  RequestActionMeta,
  CommonRequestSuccessAction,
  CommonRequestErrorAction,
} from './types';

export const commonRequestStartAction = (
  meta: RequestActionMeta
): CommonRequestStartAction => ({
  type: CommonActionTypes.CommonRequestStart,
  meta,
});

export const commonRequestSuccessAction = (
  meta: RequestActionMeta,
  response: any
): CommonRequestSuccessAction => ({
  type: CommonActionTypes.CommonRequestSuccess,
  meta,
  payload: { response },
});

export const commonRequestErrorAction = (
  meta: RequestActionMeta,
  error: any
): CommonRequestErrorAction => ({
  type: CommonActionTypes.CommonRequestError,
  meta,
  payload: { error },
});
