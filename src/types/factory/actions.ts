import { RequestActionMeta } from '../actions';

export enum FactoryActionTypes {
  DoRequest = '@@REDUX_REQUESTS_FACTORY/REQUEST/DO',
  CancelRequest = '@@REDUX_REQUESTS_FACTORY/REQUEST/CANCEL',
}

export type DoRequestAction<Params> = {
  type: FactoryActionTypes.DoRequest;
  meta: RequestActionMeta;
  payload?: Params;
};

export type CancelRequestAction<Params> = {
  type: FactoryActionTypes.CancelRequest;
  meta: RequestActionMeta;
  payload?: Params;
};

export type FactoryActions<_Response, _Error, Params> =
  | DoRequestAction<Params>
  | CancelRequestAction<Params>;

export type RequestsFactoryItemActions<_Response, _Error, Params> = {
  doRequestAction: (params?: Params) => DoRequestAction<Params>;
  cancelRequestAction: (params?: Params) => CancelRequestAction<Params>;
};
