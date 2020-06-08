import { Reducer } from 'redux';

import { Actions } from './actions';
import {
  IS_SOMETHING_LOADING_STATE_KEY,
  RESPONSES_STATE_KEY,
} from '../constants';

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
  [IS_SOMETHING_LOADING_STATE_KEY]: {
    count: number;
  };
  [RESPONSES_STATE_KEY]: {
    [key: string]:
      | RequestState
      | {
          [serializedKey: string]: RequestState;
        };
  };
};

export type RequestsReducer = Reducer<RequestsState, Actions>;

export type RootState<Key extends string> = {
  [key in Key]: RequestsState;
};
