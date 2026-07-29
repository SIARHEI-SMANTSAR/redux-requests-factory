import type { UnknownAction } from 'redux';

import { RequestActionMeta } from '../actions';

/** Public command and lifecycle action type identifiers. */
export enum FactoryActionTypes {
  /** Direct request command. */
  DoRequest = '@@REDUX_REQUESTS_FACTORY/REQUEST/DO',
  /** Cancellation marker command. */
  CancelRequest = '@@REDUX_REQUESTS_FACTORY/REQUEST/CANCEL',
  /** Cache-bypassing load command. */
  ForcedLoadData = '@@REDUX_REQUESTS_FACTORY/FORCED_LOAD',
  /** Cache-aware load command. */
  LoadData = '@@REDUX_REQUESTS_FACTORY/LOAD',
  /** Request-specific success subscription action. */
  RequestFulfilled = '@@REDUX_REQUESTS_FACTORY/REQUEST/FULFILLED',
  /** Request-specific failure subscription action. */
  RequestRejected = '@@REDUX_REQUESTS_FACTORY/REQUEST/REJECTED',
  /** Manual error-state command. */
  SetError = '@@REDUX_REQUESTS_FACTORY/REQUEST/SET/ERROR',
  /** Manual response-state command. */
  SetResponse = '@@REDUX_REQUESTS_FACTORY/REQUEST/SET/RESPONSE',
  /** Request-state reset command. */
  ResetRequest = '@@REDUX_REQUESTS_FACTORY/REQUEST/RESET',
}

/** Shared fields exposed by every generated action creator. */
export interface RequestFactoryActionCommon extends UnknownAction {
  /** Redux action type generated for this request factory. */
  type: string;
  /** Returns the action creator's Redux type. */
  toString(): string;
  /** Returns the action creator's Redux type. */
  getType(): string;
}

/** Factory command value for a request with serialized params. */
export interface RequestFactoryActionCommonWithSerializeReturnType extends UnknownAction {
  /** Redux action type. */
  type: string;
  /** Request-state identity used by the middleware and reducer. */
  meta: {
    /** Registered request-state key. */
    key: string;
    /** Cache key produced by `serializeRequestParameters`. */
    serializedKey: string;
  };
  /** Serializes the complete command identity. */
  toString(): string;
  /** Serializes the complete command identity. */
  toJSON(): string;
}

/** Factory command value for a request without serialized params. */
export interface RequestFactoryActionCommonWithoutSerializeReturnType extends UnknownAction {
  /** Redux action type. */
  type: string;
  /** Request-state identity used by the middleware and reducer. */
  meta: {
    /** Registered request-state key. */
    key: string;
  };
  /** Serializes the complete command identity. */
  toString(): string;
  /** Serializes the complete command identity. */
  toJSON(): string;
}

/** Per-dispatch behavior supported by request and cancellation commands. */
export interface ActionOptions {
  /**
   * Excludes a started request from global loading state updates.
   *
   * @default false
   */
  silent?: boolean;
  /**
   * Overrides the middleware's `forwardFactoryActions` value for this command.
   * Prefer this per-command option over globally enabling factory-action
   * forwarding when an epic, saga, reducer, or other middleware needs to
   * observe a specific command. By default, the middleware-level value is
   * inherited.
   */
  forwardFactoryAction?: boolean;
}

/** Generated actions for a request with optional params and no serialized cache key. */
export type RequestsFactoryItemActionsWithOptionalParamsWithoutSerialize<
  Resp,
  Err,
  Params,
> = {
  /** Runs direct request work without using the successful-response cache. */
  doRequestAction: RequestFactoryActionCommon & {
    (
      params?: Params,
      options?: ActionOptions
    ): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload?: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload?: Params;
      };
    };
  };
  /** Reloads the request without using the successful-response cache. */
  forcedLoadDataAction: RequestFactoryActionCommon & {
    (
      params?: Params,
      options?: ActionOptions
    ): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload?: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload?: Params;
      };
    };
  };
  /** Loads only when needed and reuses the in-flight Promise for this request key. */
  loadDataAction: RequestFactoryActionCommon & {
    (
      params?: Params,
      options?: ActionOptions
    ): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload?: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload?: Params;
      };
    };
  };
  /** Cancels the latest execution and aborts work that consumes its signal. */
  cancelRequestAction: RequestFactoryActionCommon & {
    (
      params?: Params,
      options?: ActionOptions
    ): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload?: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload?: Params;
      };
    };
  };
  /** Accessing this subscription action creator enables fulfilled dispatches. */
  requestFulfilledAction: RequestFactoryActionCommon & {
    (
      data: any,
      meta: RequestActionMeta
    ): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload: {
        response: Resp;
        params?: Params;
      };
    };
  };
  /** Accessing this subscription action creator enables rejected dispatches. */
  requestRejectedAction: RequestFactoryActionCommon & {
    (
      data: any,
      meta: RequestActionMeta
    ): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload: {
        error: Err;
        params?: Params;
      };
    };
  };
  /** Writes an error into this request's Redux state. */
  setErrorAction: RequestFactoryActionCommon & {
    (data: {
      error: Err;
      params?: Params;
    }): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload: {
        error: Err;
        params?: Params;
      };
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload: {
          error: Err;
          params?: Params;
        };
      };
    };
  };
  /** Writes a response into this request's Redux state. */
  setResponseAction: RequestFactoryActionCommon & {
    (data: {
      response: Resp;
      params?: Params;
    }): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload: {
        response: Resp;
        params?: Params;
      };
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload: {
          response: Resp;
          params?: Params;
        };
      };
    };
  };
  /** Resets state to `None`; it does not cancel active request work. */
  resetRequestAction: RequestFactoryActionCommon & {
    (params?: Params): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload?: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload?: Params;
      };
    };
  };
};

/** Generated actions for required params stored in one shared cache entry. */
export type RequestsFactoryItemActionsWithParamsWithoutSerialize<
  Resp,
  Err,
  Params,
> = {
  /** Runs direct request work without using the successful-response cache. */
  doRequestAction: RequestFactoryActionCommon & {
    (
      params: Params,
      options?: ActionOptions
    ): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload: Params;
      };
    };
  };
  /** Reloads the request without using the successful-response cache. */
  forcedLoadDataAction: RequestFactoryActionCommon & {
    (
      params: Params,
      options?: ActionOptions
    ): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload: Params;
      };
    };
  };
  /** Loads only when needed and reuses the in-flight Promise for this request key. */
  loadDataAction: RequestFactoryActionCommon & {
    (
      params: Params,
      options?: ActionOptions
    ): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload: Params;
      };
    };
  };
  /** Cancels the latest execution and aborts work that consumes its signal. */
  cancelRequestAction: RequestFactoryActionCommon & {
    (
      params?: Params,
      options?: ActionOptions
    ): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload?: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload?: Params;
      };
    };
  };
  /** Accessing this subscription action creator enables fulfilled dispatches. */
  requestFulfilledAction: RequestFactoryActionCommon & {
    (
      data: any,
      meta: RequestActionMeta
    ): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload: {
        response: Resp;
        params: Params;
      };
    };
  };
  /** Accessing this subscription action creator enables rejected dispatches. */
  requestRejectedAction: RequestFactoryActionCommon & {
    (
      data: any,
      meta: RequestActionMeta
    ): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload: {
        error: Err;
        params: Params;
      };
    };
  };
  /** Writes an error into this request's Redux state. */
  setErrorAction: RequestFactoryActionCommon & {
    (data: {
      error: Err;
      params: Params;
    }): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload: {
        error: Err;
        params: Params;
      };
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload: {
          error: Err;
          params: Params;
        };
      };
    };
  };
  /** Writes a response into this request's Redux state. */
  setResponseAction: RequestFactoryActionCommon & {
    (data: {
      response: Resp;
      params?: Params;
    }): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload: {
        response: Resp;
        params?: Params;
      };
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload: {
          response: Resp;
          params?: Params;
        };
      };
    };
  };
  /** Resets state to `None`; it does not cancel active request work. */
  resetRequestAction: RequestFactoryActionCommon & {
    (params?: Params): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload?: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload?: Params;
      };
    };
  };
};

/** Generated actions for required params stored by serialized cache key. */
export type RequestsFactoryItemActionsWithParamsWithSerialize<
  Resp,
  Err,
  Params,
> = {
  /** Runs direct request work without using the successful-response cache. */
  doRequestAction: RequestFactoryActionCommon & {
    (
      params: Params,
      options?: ActionOptions
    ): RequestFactoryActionCommonWithSerializeReturnType & {
      payload: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
          serializedKey: string;
        };
        payload: Params;
      };
    };
  };
  /** Reloads the request without using the successful-response cache. */
  forcedLoadDataAction: RequestFactoryActionCommon & {
    (
      params: Params,
      options?: ActionOptions
    ): RequestFactoryActionCommonWithSerializeReturnType & {
      payload: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
          serializedKey: string;
        };
        payload: Params;
      };
    };
  };
  /** Loads only when needed and reuses the in-flight Promise for this request key. */
  loadDataAction: RequestFactoryActionCommon & {
    (
      params: Params,
      options?: ActionOptions
    ): RequestFactoryActionCommonWithSerializeReturnType & {
      payload: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
          serializedKey: string;
        };
        payload: Params;
      };
    };
  };
  /** Cancels the latest execution and aborts work that consumes its signal. */
  cancelRequestAction: RequestFactoryActionCommon & {
    (
      params: Params,
      options?: ActionOptions
    ): RequestFactoryActionCommonWithSerializeReturnType & {
      payload: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
          serializedKey: string;
        };
        payload: Params;
      };
    };
  };
  /** Accessing this subscription action creator enables fulfilled dispatches. */
  requestFulfilledAction: RequestFactoryActionCommon & {
    (
      data: any,
      meta: RequestActionMeta
    ): RequestFactoryActionCommonWithSerializeReturnType & {
      payload: {
        response: Resp;
        params: Params;
      };
    };
  };
  /** Accessing this subscription action creator enables rejected dispatches. */
  requestRejectedAction: RequestFactoryActionCommon & {
    (
      data: any,
      meta: RequestActionMeta
    ): RequestFactoryActionCommonWithSerializeReturnType & {
      payload: {
        error: Err;
        params: Params;
      };
    };
  };
  /** Writes an error into this request's Redux state. */
  setErrorAction: RequestFactoryActionCommon & {
    (data: {
      error: Err;
      params: Params;
    }): RequestFactoryActionCommonWithSerializeReturnType & {
      payload: {
        error: Err;
        params: Params;
      };
      toObject(): {
        type: string;
        meta: {
          key: string;
          serializedKey: string;
        };
        payload: {
          error: Err;
          params: Params;
        };
      };
    };
  };
  /** Writes a response into this request's Redux state. */
  setResponseAction: RequestFactoryActionCommon & {
    (data: {
      response: Resp;
      params: Params;
    }): RequestFactoryActionCommonWithSerializeReturnType & {
      payload: {
        response: Resp;
        params: Params;
      };
      toObject(): {
        type: string;
        meta: {
          key: string;
          serializedKey: string;
        };
        payload: {
          response: Resp;
          params: Params;
        };
      };
    };
  };
  /** Resets state to `None`; it does not cancel active request work. */
  resetRequestAction: RequestFactoryActionCommon & {
    (params: Params): RequestFactoryActionCommonWithSerializeReturnType & {
      payload: Params;
      toObject(): {
        type: string;
        meta: {
          key: string;
          serializedKey: string;
        };
        payload: Params;
      };
    };
  };
};

/** Union of all generated request action sets. */
export type RequestsFactoryItemActions<Resp, Err, Params> =
  | RequestsFactoryItemActionsWithOptionalParamsWithoutSerialize<
      Resp,
      Err,
      Params
    >
  | RequestsFactoryItemActionsWithParamsWithoutSerialize<Resp, Err, Params>
  | RequestsFactoryItemActionsWithParamsWithSerialize<Resp, Err, Params>;
