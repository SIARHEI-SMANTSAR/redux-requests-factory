import {
  CommonRequestStartAction,
  CommonActionTypes,
  CommonRequestActionMeta,
  CommonRequestSuccessAction,
  CommonRequestErrorAction,
} from './types';

export const commonRequestStartAction = (
  meta: CommonRequestActionMeta
): CommonRequestStartAction => ({
  type: CommonActionTypes.CommonRequestStart,
  meta,
});

export const commonRequestSuccessAction = (
  meta: CommonRequestActionMeta,
  response: any
): CommonRequestSuccessAction => ({
  type: CommonActionTypes.CommonRequestSuccess,
  meta,
  payload: { response },
});

export const commonRequestErrorAction = (
  meta: CommonRequestActionMeta,
  error: any
): CommonRequestErrorAction => ({
  type: CommonActionTypes.CommonRequestError,
  meta,
  payload: { error },
});
