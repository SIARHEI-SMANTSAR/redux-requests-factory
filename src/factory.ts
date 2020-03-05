import { Dispatch } from 'redux';

import { CreateRequestsFactory } from './types';
import { commonRequestStartAction } from './actions';

export const createRequestsFactory: CreateRequestsFactory = ({
  stateRequestsKey,
}) => ({ request }) => {
  return {
    doRequestAction: params => async (
      dispatch: Dispatch,
      _getState: () => any
    ) => {
      dispatch(commonRequestStartAction({ key: stateRequestsKey }));
      const data = await request(params);
      console.log(data);
    },
  };
};
