import {
  CommonRequestStartAction,
  CommonActionTypes,
  RequestActionMeta,
  CommonRequestSuccessAction,
  CommonRequestErrorAction,
  CommonRequestCancelAction,
  CommonRequestResetAction,
  GlobalActionTypes,
  GlobalLoadingIncrementAction,
  GlobalLoadingDecrementAction,
  HydrateRequestsActionCreator,
  PreparedConfig,
  RequestsState,
} from './types';

export const commonRequestStartAction = (
  meta: RequestActionMeta
): CommonRequestStartAction => ({
  type: CommonActionTypes.RequestStart,
  meta,
});

export const commonRequestSuccessAction = (
  meta: RequestActionMeta,
  response: any
): CommonRequestSuccessAction => ({
  type: CommonActionTypes.RequestSuccess,
  meta,
  payload: { response },
});

export const commonRequestErrorAction = (
  meta: RequestActionMeta,
  error: any
): CommonRequestErrorAction => ({
  type: CommonActionTypes.RequestError,
  meta,
  payload: { error },
});

export const commonRequestCancelAction = (
  meta: RequestActionMeta
): CommonRequestCancelAction => ({
  type: CommonActionTypes.RequestCancel,
  meta,
});

export const commonRequestResetAction = (
  meta: RequestActionMeta
): CommonRequestResetAction => ({
  type: CommonActionTypes.RequestReset,
  meta,
});

export const globalLoadingIncrementAction =
  (): GlobalLoadingIncrementAction => ({
    type: GlobalActionTypes.LoadingIncrement,
  });

export const globalLoadingDecrementAction =
  (): GlobalLoadingDecrementAction => ({
    type: GlobalActionTypes.LoadingDecrement,
  });

export const createHydrateRequestsAction =
  <Key extends string>({
    stateRequestsKey,
  }: PreparedConfig<Key>): HydrateRequestsActionCreator<Key> =>
  (requestsState: RequestsState) => ({
    type: GlobalActionTypes.HydrateRequests,
    meta: { stateRequestsKey },
    payload: requestsState,
  });
