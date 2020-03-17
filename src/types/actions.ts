export enum CommonActionTypes {
  CommonRequestStart = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/START',
  CommonRequestSuccess = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/SUCCESS',
  CommonRequestError = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/ERROR',
  CommonRequestCancel = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/CANCEL',
  CommonRequestReset = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/RESET',
}

export type RequestActionMeta = {
  key: string;
  serializedKey?: string;
};

export type CommonRequestStartAction = {
  type: CommonActionTypes.CommonRequestStart;
  meta: RequestActionMeta;
};

export type CommonRequestSuccessAction = {
  type: CommonActionTypes.CommonRequestSuccess;
  meta: RequestActionMeta;
  payload: { response: any };
};

export type CommonRequestErrorAction = {
  type: CommonActionTypes.CommonRequestError;
  meta: RequestActionMeta;
  payload: { error: any };
};

export type CommonRequestCancelAction = {
  type: CommonActionTypes.CommonRequestCancel;
  meta: RequestActionMeta;
};

export type CommonRequestResetAction = {
  type: CommonActionTypes.CommonRequestReset;
  meta: RequestActionMeta;
};

export type CommonActions =
  | CommonRequestStartAction
  | CommonRequestSuccessAction
  | CommonRequestErrorAction
  | CommonRequestCancelAction
  | CommonRequestResetAction;
