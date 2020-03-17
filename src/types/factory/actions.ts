import { RequestActionMeta } from '../actions';

export enum FactoryActionTypes {
  DoRequest = '@@REDUX_REQUESTS_FACTORY/REQUEST/DO',
  CancelRequest = '@@REDUX_REQUESTS_FACTORY/REQUEST/CANCEL',
  ForcedLoadData = '@@REDUX_REQUESTS_FACTORY/FORCED_LOAD',
  LoadData = '@@REDUX_REQUESTS_FACTORY/LOAD',
  RequestFulfilled = '@@REDUX_REQUESTS_FACTORY/REQUEST/FULFILLED',
  RequestRejected = '@@REDUX_REQUESTS_FACTORY/REQUEST/REJECTED',
  SetError = '@@REDUX_REQUESTS_FACTORY/REQUEST/SET/ERROR',
  SetResponse = '@@REDUX_REQUESTS_FACTORY/REQUEST/SET/RESPONSE',
  ResetRequest = '@@REDUX_REQUESTS_FACTORY/REQUEST/RESET',
}

export type DoRequestAction<Params> = {
  type: string;
  meta: RequestActionMeta;
  payload?: Params;
};

export type ForcedLoadDataAction<Params> = {
  type: string;
  meta: RequestActionMeta;
  payload?: Params;
};

export type LoadDataAction<Params> = {
  type: string;
  meta: RequestActionMeta;
  payload?: Params;
};

export type CancelRequestAction<Params> = {
  type: string;
  meta: RequestActionMeta;
  payload?: Params;
};

export type RequestFulfilledAction<Resp, Params> = {
  type: string;
  meta: RequestActionMeta;
  payload: {
    response: Resp;
    params?: Params;
  };
};

export type RequestRejectedAction<Err, Params> = {
  type: string;
  meta: RequestActionMeta;
  payload: {
    error: Err;
    params?: Params;
  };
};

export type SetErrorAction<Err, Params> = {
  type: string;
  meta: RequestActionMeta;
  payload: {
    error: Err;
    params?: Params;
  };
};

export type SetResponseAction<Resp, Params> = {
  type: string;
  meta: RequestActionMeta;
  payload: {
    response: Resp;
    params?: Params;
  };
};

export type ResetRequestAction<Params> = {
  type: string;
  meta: RequestActionMeta;
  payload?: Params;
};

export type RequestsFactoryItemActions<Resp, Err, Params> = {
  doRequestAction: {
    (params?: Params): DoRequestAction<Params>;
    type: string;
    toString(): string;
  };
  forcedLoadDataAction: {
    (params?: Params): ForcedLoadDataAction<Params>;
    type: string;
    toString(): string;
  };
  loadDataAction: {
    (params?: Params): LoadDataAction<Params>;
    type: string;
    toString(): string;
  };
  cancelRequestAction: {
    (params?: Params): CancelRequestAction<Params>;
    type: string;
    toString(): string;
  };
  requestFulfilledAction: {
    (data: any, meta: RequestActionMeta): RequestFulfilledAction<Resp, Params>;
    type: string;
    toString(): string;
  };
  requestRejectedAction: {
    (data: any, meta: RequestActionMeta): RequestRejectedAction<Err, Params>;
    type: string;
    toString(): string;
  };
  setErrorAction: {
    (data: { error: Err; params?: Params }): SetErrorAction<Err, Params>;
    type: string;
    toString(): string;
  };
  setResponseAction: {
    (data: { response: Resp; params?: Params }): SetResponseAction<
      Resp,
      Params
    >;
    type: string;
    toString(): string;
  };
  resetRequestAction: {
    (params?: Params): ResetRequestAction<Params>;
    type: string;
    toString(): string;
  };
};

export type GetActionConfig<Params, Data = Params | undefined> = {
  params?: Params;
  meta: RequestActionMeta;
  requestKey: string;
  data: Data;
};
