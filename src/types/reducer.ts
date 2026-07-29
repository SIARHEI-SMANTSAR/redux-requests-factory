import type { Reducer } from 'redux';

import {
  IS_SOMETHING_LOADING_STATE_KEY,
  RESPONSES_STATE_KEY,
} from '../constants';

/** Lifecycle status stored for one request key. */
export enum RequestsStatuses {
  /** No request has completed or is currently running. */
  None = 'none',
  /** A request is currently running. */
  Loading = 'loading',
  /** The latest handled request completed successfully. */
  Success = 'success',
  /** The latest handled request failed. */
  Failed = 'failed',
  /** The latest active request was marked as canceled. */
  Canceled = 'canceled',
}

/** Redux state stored for one request or serialized parameter key. */
export type RequestState = {
  /** Current request lifecycle status. */
  status: RequestsStatuses;
  /** Error produced by the latest failed request, when available. */
  error?: any;
  /** Response produced by the latest successful request, when available. */
  response?: any;
  /** Epoch timestamp at which the latest successful response was stored. */
  fulfilledAt?: number;
};

/** Complete state slice managed by `requestsReducer`. */
export type RequestsState = {
  /** Internal counter used by `isSomethingLoadingSelector`. */
  [IS_SOMETHING_LOADING_STATE_KEY]: {
    count: number;
  };
  /** Request states grouped by request key and optional serialized params. */
  [RESPONSES_STATE_KEY]: {
    [key: string]:
      | RequestState
      | {
          [serializedKey: string]: RequestState;
        };
  };
};

/** Reducer that owns a `RequestsState` slice. */
export type RequestsReducer = Reducer<RequestsState>;

/** Minimum root-state shape required by a factory mounted at `Key`. */
export type RootState<Key extends string> = {
  [key in Key]: RequestsState;
};
