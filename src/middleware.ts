import { Middleware } from 'redux';

import { PreparedConfig, FactoryActionTypes } from './types';

export const createRequestsFactoryMiddleware = ({}: PreparedConfig): Middleware => {
  return ({ dispatch, getState }) => next => async action => {
    if (
      typeof action === 'function' &&
      Object.values(FactoryActionTypes).includes(action.type)
    ) {
      return await action(dispatch, getState);
    }

    return next(action);
  };
};
