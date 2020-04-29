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

export interface RequestFactoryActionCommon {
  type: string;
  toString(): string;
}

export interface RequestFactoryActionCommonWithSerializeReturnType {
  type: string;
  meta: {
    key: string;
    serializedKey: string;
  };
  toString(): string;
  toJSON(): string;
}

export interface RequestFactoryActionCommonWithoutSerializeReturnType {
  type: string;
  meta: {
    key: string;
  };
  toString(): string;
  toJSON(): string;
}

export type RequestsFactoryItemActionsWithOptionalParamsWithoutSerialize<
  Resp,
  Err,
  Params
> = {
  doRequestAction: RequestFactoryActionCommon & {
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
  forcedLoadDataAction: RequestFactoryActionCommon & {
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
  loadDataAction: RequestFactoryActionCommon & {
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
  cancelRequestAction: RequestFactoryActionCommon & {
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

export type RequestsFactoryItemActionsWithParamsWithoutSerialize<
  Resp,
  Err,
  Params
> = {
  doRequestAction: RequestFactoryActionCommon & {
    (params: Params): RequestFactoryActionCommonWithoutSerializeReturnType & {
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
  forcedLoadDataAction: RequestFactoryActionCommon & {
    (params: Params): RequestFactoryActionCommonWithoutSerializeReturnType & {
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
  loadDataAction: RequestFactoryActionCommon & {
    (params: Params): RequestFactoryActionCommonWithoutSerializeReturnType & {
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
  cancelRequestAction: RequestFactoryActionCommon & {
    (params: Params): RequestFactoryActionCommonWithoutSerializeReturnType & {
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
  setResponseAction: RequestFactoryActionCommon & {
    (data: {
      response: Resp;
      params: Params;
    }): RequestFactoryActionCommonWithoutSerializeReturnType & {
      payload: {
        response: Resp;
        params: Params;
      };
      toObject(): {
        type: string;
        meta: {
          key: string;
        };
        payload: {
          response: Resp;
          params: Params;
        };
      };
    };
  };
  resetRequestAction: RequestFactoryActionCommon & {
    (params: Params): RequestFactoryActionCommonWithoutSerializeReturnType & {
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
};

export type RequestsFactoryItemActionsWithParamsWithSerialize<
  Resp,
  Err,
  Params
> = {
  doRequestAction: RequestFactoryActionCommon & {
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
  forcedLoadDataAction: RequestFactoryActionCommon & {
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
  loadDataAction: RequestFactoryActionCommon & {
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
  cancelRequestAction: RequestFactoryActionCommon & {
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

export type RequestsFactoryItemActions<Resp, Err, Params> =
  | RequestsFactoryItemActionsWithOptionalParamsWithoutSerialize<
      Resp,
      Err,
      Params
    >
  | RequestsFactoryItemActionsWithParamsWithoutSerialize<Resp, Err, Params>
  | RequestsFactoryItemActionsWithParamsWithSerialize<Resp, Err, Params>;
