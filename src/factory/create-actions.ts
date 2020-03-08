import { Dispatch } from 'redux';

import {
  RequestsFactoryItemActions,
  PreparedConfig,
  RequestFactoryConfig,
  RequestActionMeta,
  FactoryActionTypes,
  DoRequestAction,
} from '../types';
import {
  commonRequestStartAction,
  commonRequestSuccessAction,
  commonRequestErrorAction,
} from '../actions';
import { actionToString } from './helpers';

const createActions = <Response, Error, Params, _State>(
  _preparedConfig: PreparedConfig,
  { request, stateRequestKey }: RequestFactoryConfig<Response, Params>
): RequestsFactoryItemActions<Response, Error, Params> => {
  const meta: RequestActionMeta = { key: stateRequestKey };

  return {
    doRequestAction: params => {
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

      return doRequest as DoRequestAction<Params>;
    },
  };
};

export default createActions;
