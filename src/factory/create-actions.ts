import { Dispatch } from 'redux';

import {
  RequestsFactoryItemActions,
  PreparedConfig,
  RequestFactoryConfig,
  RequestActionMeta,
  FactoryActionTypes,
} from '../types';
import {
  commonRequestStartAction,
  commonRequestSuccessAction,
  commonRequestErrorAction,
} from '../actions';
import { actionToString, isWithSerialize } from './helpers';

const createActions = <Response, Error, Params, _State>(
  _preparedConfig: PreparedConfig,
  factoryConfig: RequestFactoryConfig<Response, Params>
): RequestsFactoryItemActions<Response, Error, Params> => {
  const { request, stateRequestKey } = factoryConfig;

  // const cancelMapByKey: { [key: string]: boolean } = {};

  return {
    doRequestAction: (params?: Params) => {
      const meta: RequestActionMeta = { key: stateRequestKey };

      if (isWithSerialize<Response, Params>(factoryConfig)) {
        meta.serializedKey = factoryConfig.serializeRequestParameters(params);
      }

      const doRequest = async (dispatch: Dispatch, _getState: () => any) => {
        dispatch(commonRequestStartAction(meta));
        try {
          const response = await request(params);
          dispatch(commonRequestSuccessAction(meta, response));
        } catch (error) {
          dispatch(commonRequestErrorAction(meta, error));
        }
      };

      doRequest.type = FactoryActionTypes.DoRequest;
      doRequest.meta = meta;
      doRequest.payload = params;

      doRequest.toString = actionToString;

      return doRequest;
    },
  };
};

export default createActions;
