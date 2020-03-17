import {
  CommonRequestStartAction,
  CommonActionTypes,
  RequestActionMeta,
  CommonRequestSuccessAction,
  CommonRequestErrorAction,
  CommonRequestCancelAction,
  CommonRequestResetAction,
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

export const commonRequestCancelAction = (
  meta: RequestActionMeta
): CommonRequestCancelAction => ({
  type: CommonActionTypes.CommonRequestCancel,
  meta,
});

export const commonRequestResetAction = (
  meta: RequestActionMeta
): CommonRequestResetAction => ({
  type: CommonActionTypes.CommonRequestReset,
  meta,
});
