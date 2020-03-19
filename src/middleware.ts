import { Middleware } from 'redux';

import { PreparedConfig } from './types';
import { isFactoryAction } from './factory/helpers';

export const createRequestsFactoryMiddleware = <Key>({}: PreparedConfig<
  Key
>): Middleware => {
  return ({ dispatch, getState }) => next => async action => {
    if (typeof action === 'function' && isFactoryAction(action.type)) {
      return await action(dispatch, getState);
    }

    return next(action);
  };
};
