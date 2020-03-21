import { Reducer } from 'redux';

import { CommonActions } from './actions';

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

export type RootSate<Key extends string> = {
  [key in Key]: RequestsState;
};
