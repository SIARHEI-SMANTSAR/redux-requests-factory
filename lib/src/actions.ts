import {
  CommonRequestStartAction,
  CommonActionTypes,
  CommonRequestActionMeta,
} from './types';

export const commonRequestStartAction = (
  meta: CommonRequestActionMeta
): CommonRequestStartAction => ({
  type: CommonActionTypes.CommonRequestStart,
  meta,
});
