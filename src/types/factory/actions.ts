import { RequestActionMeta } from '../actions';

export enum FactoryActionTypes {
  DoRequest = '@@REDUX_REQUESTS_FACTORY/REQUEST/DO',
}

export type DoRequestAction<Params> = {
  type: FactoryActionTypes.DoRequest;
  meta: RequestActionMeta;
  payload?: Params;
};

export type FactoryActions<_Response, _Error, Params> = DoRequestAction<Params>;

export type RequestsFactoryItemActions<_Response, _Error, Params> = {
  doRequestAction: (params?: Params) => DoRequestAction<Params>;
};
