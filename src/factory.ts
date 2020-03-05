import { Dispatch } from 'redux';

import { PreparedConfig, RequestFactoryConfig } from './types';
import { commonRequestStartAction } from './actions';

export const createRequestsFactory = ({ stateRequestsKey }: PreparedConfig) => <
  Response = any,
  _Error = any,
  Params = any
>({
  request,
}: RequestFactoryConfig<Params, Response>) => {
  return {
    doRequestAction: (params?: Params) => async (
      dispatch: Dispatch,
      _getState: () => any
    ) => {
      dispatch(commonRequestStartAction({ key: stateRequestsKey }));
      const data = await request(params);
      console.log(data);
    },
  };
};
