import { Dispatch } from 'redux';

import {
  RequestsFactoryItemActions,
  PreparedConfig,
  RequestFactoryConfig,
  CommonRequestActionMeta,
} from '../types';
import {
  commonRequestStartAction,
  commonRequestSuccessAction,
  commonRequestErrorAction,
} from '../actions';

const createActions = <Response, Error, Params, _State>(
  _preparedConfig: PreparedConfig,
  { request, stateRequestKey }: RequestFactoryConfig<Response, Params>
): RequestsFactoryItemActions<Response, Error, Params> => {
  const meta: CommonRequestActionMeta = { key: stateRequestKey };

  return {
    doRequestAction: params => async (
      dispatch: Dispatch,
      _getState: () => any
    ) => {
      dispatch(commonRequestStartAction(meta));
      try {
        const response = await request(params);
        dispatch(commonRequestSuccessAction(meta, response));
      } catch (error) {
        dispatch(commonRequestErrorAction(meta, error));
      }
    },
  };
};

export default createActions;
