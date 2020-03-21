import { Middleware } from 'redux';

import { PreparedConfig } from './types';
import { isFactoryAction } from './factory/helpers';

export const createRequestsFactoryMiddleware = <Key>({}: PreparedConfig<
  Key
>): Middleware & { toPromise: () => Promise<void> } => {
  const actions: { [key: string]: Promise<void> } = {};

  const middleware: Middleware & { toPromise: () => Promise<void> } = ({
    dispatch,
    getState,
  }) => next => async action => {
    if (typeof action === 'function' && isFactoryAction(action.type)) {
      actions[action.type as string] = action(dispatch, getState);
      return await action(dispatch, getState);
    }

    return next(action);
  };

  middleware.toPromise = async () => {
    const prpmises = Object.values(actions);
    for (let index = 0; index < prpmises.length; index++) {
      await prpmises[index];
    }
  };

  return middleware;
};
