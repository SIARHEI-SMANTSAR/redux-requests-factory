export enum CommonActionTypes {
  CommonRequestStart = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/START',
  CommonRequestSuccess = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/SUCCESS',
  CommonRequestError = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/ERROR',
  CommonRequestCancel = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/CANCEL',
}

export type CommonRequestActionMeta = {
  key: string;
  serializedKey?: string;
};

export type CommonRequestStartAction = {
  type: CommonActionTypes.CommonRequestStart;
  meta: CommonRequestActionMeta;
};

export type CommonRequestSuccessAction = {
  type: CommonActionTypes.CommonRequestSuccess;
  meta: CommonRequestActionMeta;
  payload: { response: any };
};

export type CommonRequestErrorAction = {
  type: CommonActionTypes.CommonRequestError;
  meta: CommonRequestActionMeta;
  payload: { error: any };
};

export type CommonRequestCancelAction = {
  type: CommonActionTypes.CommonRequestCancel;
  meta: CommonRequestActionMeta;
};

export type CommonActions =
  | CommonRequestStartAction
  | CommonRequestSuccessAction
  | CommonRequestErrorAction
  | CommonRequestCancelAction;
