import { Middleware } from 'redux';

import { PreparedConfig } from './types';

export const createRequestsFactoryMiddleware = ({}: PreparedConfig): Middleware => {
  return ({ dispatch, getState }) => next => async action => {
    // TODO
    if (typeof action === 'function') {
      return await action(dispatch, getState);
    }

    return next(action);
  };
};
