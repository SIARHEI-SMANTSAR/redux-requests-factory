import { RequestActionMeta } from '../actions';

export enum FactoryActionTypes {
  DoRequest = '@@REDUX_REQUESTS_FACTORY/REQUEST/DO',
  CancelRequest = '@@REDUX_REQUESTS_FACTORY/REQUEST/CANCEL',
  ForcedLoadData = '@@REDUX_REQUESTS_FACTORY/FORCED_LOAD',
  LoadData = '@@REDUX_REQUESTS_FACTORY/LOAD',
  RequestFulfilled = '@@REDUX_REQUESTS_FACTORY/REQUEST/FULFILLED',
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

export type RequestFulfilledAction<Response, Params> = {
  type: string;
  meta: RequestActionMeta;
  payload: {
    response: Response;
    params?: Params;
  };
};

export type RequestsFactoryItemActions<Response, _Error, Params> = {
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
    (data: any, meta: RequestActionMeta): RequestFulfilledAction<
      Response,
      Params
    >;
    type: string;
    toString(): string;
  };
};

export type GetActionConfig<Params> = {
  params?: Params;
  meta: RequestActionMeta;
  requestKey: string;
};
