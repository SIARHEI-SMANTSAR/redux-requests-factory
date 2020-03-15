import { Dispatch } from 'redux';

import {
  RequestsFactoryItemActions,
  PreparedConfig,
  RequestFactoryConfig,
  RequestActionMeta,
  FactoryActionTypes,
  DoRequestAction,
  CancelRequestAction,
} from '../types';
import {
  commonRequestStartAction,
  commonRequestSuccessAction,
  commonRequestErrorAction,
  commonRequestCancelAction,
} from '../actions';
import { actionToString, isWithSerialize, getRequestKey } from './helpers';

const createActions = <Response, Error, Params, State>(
  _preparedConfig: PreparedConfig,
  factoryConfig: RequestFactoryConfig<Response, Params>
): RequestsFactoryItemActions<Response, Error, Params> => {
  const { request, stateRequestKey } = factoryConfig;

  const cancelMapByKey: { [key: string]: boolean } = {};
  const doRequestMapByKey: { [key: string]: boolean } = {};

  return {
    doRequestAction: (params?: Params) => {
      const meta: RequestActionMeta = { key: stateRequestKey };
      const requestKey = getRequestKey(factoryConfig, params);

      cancelMapByKey[requestKey] = false;
      doRequestMapByKey[requestKey] = true;

      if (isWithSerialize<Response, Params>(factoryConfig)) {
        meta.serializedKey = factoryConfig.serializeRequestParameters(params);
      }

      const doRequest = async (dispatch: Dispatch, _getState: () => State) => {
        dispatch(commonRequestStartAction(meta));
        try {
          const response = await request(params);
          if (!cancelMapByKey[requestKey]) {
            dispatch(commonRequestSuccessAction(meta, response));
          }
        } catch (error) {
          if (!cancelMapByKey[requestKey]) {
            dispatch(commonRequestErrorAction(meta, error));
          }
        } finally {
          doRequestMapByKey[requestKey] = false;
        }
      };

      doRequest.type = FactoryActionTypes.DoRequest;
      doRequest.meta = meta;
      doRequest.payload = params;

      doRequest.toString = actionToString;

      return doRequest as DoRequestAction<Params>;
    },
    cancelRequestAction: (params?: Params) => {
      const meta: RequestActionMeta = { key: stateRequestKey };
      const requestKey = getRequestKey(factoryConfig, params);

      if (doRequestMapByKey[requestKey]) {
        cancelMapByKey[requestKey] = true;
      }

      if (isWithSerialize<Response, Params>(factoryConfig)) {
        meta.serializedKey = factoryConfig.serializeRequestParameters(params);
      }

      const cancelRequest = async (
        dispatch: Dispatch,
        _getState: () => State
      ) => {
        if (doRequestMapByKey[requestKey]) {
          dispatch(commonRequestCancelAction(meta));
        }
      };

      cancelRequest.type = FactoryActionTypes.CancelRequest;
      cancelRequest.meta = meta;
      cancelRequest.payload = params;

      cancelRequest.toString = actionToString;

      return cancelRequest as CancelRequestAction<Params>;
    },
  };
};

export default createActions;
