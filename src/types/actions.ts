import type { UnknownAction } from 'redux';

import type { RequestsState } from './reducer';

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

export type CommonRequestStartAction = UnknownAction & {
  type: CommonActionTypes.RequestStart;
  meta: RequestActionMeta;
};

export type CommonRequestSuccessAction = UnknownAction & {
  type: CommonActionTypes.RequestSuccess;
  meta: RequestActionMeta;
  payload: { response: any };
};

export type CommonRequestErrorAction = UnknownAction & {
  type: CommonActionTypes.RequestError;
  meta: RequestActionMeta;
  payload: { error: any };
};

export type CommonRequestCancelAction = UnknownAction & {
  type: CommonActionTypes.RequestCancel;
  meta: RequestActionMeta;
};

export type CommonRequestResetAction = UnknownAction & {
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
  HydrateRequests = '@@REDUX_REQUESTS_FACTORY/GLOBAL/HYDRATE_REQUESTS',
}

export type GlobalLoadingIncrementAction = UnknownAction & {
  type: GlobalActionTypes.LoadingIncrement;
};

export type GlobalLoadingDecrementAction = UnknownAction & {
  type: GlobalActionTypes.LoadingDecrement;
};

export type HydrateRequestsAction<Key extends string = string> =
  UnknownAction & {
    type: GlobalActionTypes.HydrateRequests;
    meta: { stateRequestsKey: Key };
    payload: RequestsState;
  };

export interface HydrateRequestsActionCreator<Key extends string> {
  (requestsState: RequestsState): HydrateRequestsAction<Key>;
}

export type GlobalActions =
  | GlobalLoadingIncrementAction
  | GlobalLoadingDecrementAction
  | HydrateRequestsAction;

export type Actions = CommonActions | GlobalActions;
