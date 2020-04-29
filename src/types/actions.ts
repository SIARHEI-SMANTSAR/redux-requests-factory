export enum CommonActionTypes {
  RequestStart = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/START',
  RequestSuccess = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/SUCCESS',
  RequestError = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/ERROR',
  RequestCancel = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/CANCEL',
  RequestReset = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/RESET',
}

export type RequestActionMeta = {
  key: string;
  serializedKey?: string;
};

export type CommonRequestStartAction = {
  type: CommonActionTypes.RequestStart;
  meta: RequestActionMeta;
};

export type CommonRequestSuccessAction = {
  type: CommonActionTypes.RequestSuccess;
  meta: RequestActionMeta;
  payload: { response: any };
};

export type CommonRequestErrorAction = {
  type: CommonActionTypes.RequestError;
  meta: RequestActionMeta;
  payload: { error: any };
};

export type CommonRequestCancelAction = {
  type: CommonActionTypes.RequestCancel;
  meta: RequestActionMeta;
};

export type CommonRequestResetAction = {
  type: CommonActionTypes.RequestReset;
  meta: RequestActionMeta;
};

export type CommonActions =
  | CommonRequestStartAction
  | CommonRequestSuccessAction
  | CommonRequestErrorAction
  | CommonRequestCancelAction
  | CommonRequestResetAction;

export enum GlobalActionTypes {
  LoadingIncrement = '@@REDUX_REQUESTS_FACTORY/GLOBAL/LOADING/INCREMENT',
  LoadingDecrement = '@@REDUX_REQUESTS_FACTORY/GLOBAL/LOADING/DECREMENT',
}

export type GlobalLoadingIncrementAction = {
  type: GlobalActionTypes.LoadingIncrement;
};

export type GlobalLoadingDecrementAction = {
  type: GlobalActionTypes.LoadingDecrement;
};

export type GlobalActions =
  | GlobalLoadingIncrementAction
  | GlobalLoadingDecrementAction;

export type Actions = CommonActions | GlobalActions;
