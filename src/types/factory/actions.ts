import { RequestActionMeta } from '../actions';

export enum FactoryActionTypes {
  DoRequest = '@@REDUX_REQUESTS_FACTORY/REQUEST/DO',
  CancelRequest = '@@REDUX_REQUESTS_FACTORY/REQUEST/CANCEL',
}

export type DoRequestAction<Params> = {
  type: string;
  meta: RequestActionMeta;
  payload?: Params;
};

export type CancelRequestAction<Params> = {
  type: string;
  meta: RequestActionMeta;
  payload?: Params;
};

export type RequestsFactoryItemActions<_Response, _Error, Params> = {
  doRequestAction: (params?: Params) => DoRequestAction<Params>;
  cancelRequestAction: (params?: Params) => CancelRequestAction<Params>;
};

export type GetActionConfig<Params> = {
  params?: Params;
  meta: RequestActionMeta;
  requestKey: string;
};
