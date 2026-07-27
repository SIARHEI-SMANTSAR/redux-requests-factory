import type { UnknownAction } from 'redux';

import type { RequestsState } from './reducer';

/** Internal action types consumed by `requestsReducer`. */
export enum CommonActionTypes {
  /** A request entered the loading state. */
  RequestStart = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/START',
  /** A request stored a successful response. */
  RequestSuccess = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/SUCCESS',
  /** A request stored an error. */
  RequestError = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/ERROR',
  /** A request was marked as canceled. */
  RequestCancel = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/CANCEL',
  /** A request state was reset. */
  RequestReset = '@@REDUX_REQUESTS_FACTORY/COMMON/REQUEST/RESET',
}

/** Identifies a request state and its optional serialized parameter entry. */
export type RequestActionMeta = {
  /** Registered `stateRequestKey` for the request. */
  key: string;
  /** Cache key returned by `serializeRequestParameters`, when configured. */
  serializedKey?: string;
};

/** Internal action dispatched when a request starts. */
export type CommonRequestStartAction = UnknownAction & {
  type: CommonActionTypes.RequestStart;
  meta: RequestActionMeta;
};

/** Internal action dispatched when a request succeeds. */
export type CommonRequestSuccessAction = UnknownAction & {
  type: CommonActionTypes.RequestSuccess;
  meta: RequestActionMeta;
  payload: { response: any };
};

/** Internal action dispatched when a request fails. */
export type CommonRequestErrorAction = UnknownAction & {
  type: CommonActionTypes.RequestError;
  meta: RequestActionMeta;
  payload: { error: any };
};

/** Internal action dispatched when an active request is marked as canceled. */
export type CommonRequestCancelAction = UnknownAction & {
  type: CommonActionTypes.RequestCancel;
  meta: RequestActionMeta;
};

/** Internal action dispatched when request state is reset. */
export type CommonRequestResetAction = UnknownAction & {
  type: CommonActionTypes.RequestReset;
  meta: RequestActionMeta;
};

/** Union of internal request-state actions. */
export type CommonActions =
  | CommonRequestStartAction
  | CommonRequestSuccessAction
  | CommonRequestErrorAction
  | CommonRequestCancelAction
  | CommonRequestResetAction;

/** Factory-wide action types consumed by `requestsReducer`. */
export enum GlobalActionTypes {
  /** Increments the global loading counter. */
  LoadingIncrement = '@@REDUX_REQUESTS_FACTORY/GLOBAL/LOADING/INCREMENT',
  /** Decrements the global loading counter. */
  LoadingDecrement = '@@REDUX_REQUESTS_FACTORY/GLOBAL/LOADING/DECREMENT',
  /** Merges a serialized requests slice into a matching factory reducer. */
  HydrateRequests = '@@REDUX_REQUESTS_FACTORY/GLOBAL/HYDRATE_REQUESTS',
}

/** Internal action that increments the global loading counter. */
export type GlobalLoadingIncrementAction = UnknownAction & {
  type: GlobalActionTypes.LoadingIncrement;
};

/** Internal action that decrements the global loading counter. */
export type GlobalLoadingDecrementAction = UnknownAction & {
  type: GlobalActionTypes.LoadingDecrement;
};

/** Action that merges a serialized requests slice into the matching factory. */
export type HydrateRequestsAction<Key extends string = string> =
  UnknownAction & {
    type: GlobalActionTypes.HydrateRequests;
    meta: { stateRequestsKey: Key };
    payload: RequestsState;
  };

/** Creates hydration actions scoped to one factory's `stateRequestsKey`. */
export interface HydrateRequestsActionCreator<Key extends string> {
  /** @param requestsState Requests slice returned by `requestsStateSelector`. */
  (requestsState: RequestsState): HydrateRequestsAction<Key>;
}

/** Union of factory-wide reducer actions. */
export type GlobalActions =
  | GlobalLoadingIncrementAction
  | GlobalLoadingDecrementAction
  | HydrateRequestsAction;

/** Union of all plain actions consumed by `requestsReducer`. */
export type Actions = CommonActions | GlobalActions;
