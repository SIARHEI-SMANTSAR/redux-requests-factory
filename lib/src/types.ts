import { Reducer, Middleware } from 'redux';

export type Config = {
  stateRequestsKey?: string;
};

export type PreparedConfig = {
  stateRequestsKey: string;
};

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

export enum RequestsStatuses {
  None = 'none',
  Loading = 'loading',
  Success = 'success',
  Failed = 'failed',
  Canceled = 'canceled',
}

export type RequestState = {
  status: RequestsStatuses;
  error?: any;
  response?: any;
};

export type RequestsState = {
  [key: string]:
    | RequestState
    | {
        [serializedKey: string]: RequestState;
      };
};

export type RequestsReducer = Reducer<RequestsState, CommonActions>;

export type RequestFactoryConfig<P, T> = {
  request: (params?: P) => Promise<T>;
};

export type RequestsFactoryItem<Params> = {
  doRequestAction: (params?: Params) => any;
};

export type RequestsFactory = <Response = any, _Error = any, Params = any>(
  config: RequestFactoryConfig<Params, Response>
) => RequestsFactoryItem<Params>;

export type CreateRequestsFactory = (
  preparedConfig: PreparedConfig
) => RequestsFactory;

export type ReduxRequestsFactory = {
  stateRequestsKey: string;
  requestsFactoryMiddleware: Middleware;
  requestsFactory: RequestsFactory;
  requestsReducer: RequestsReducer;
};
