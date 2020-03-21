import { Middleware } from 'redux';

import {
  PreparedConfig,
  CreateRequestsFactoryMiddleware,
  MiddlewareConfig,
} from './types';
import { isFactoryAction } from './factory/helpers';

export const getCreateRequestsFactoryMiddleware = <Key>({}: PreparedConfig<
  Key
>): CreateRequestsFactoryMiddleware => (
  middlewareConfig: MiddlewareConfig = {}
) => {
  const actions: { [key: string]: Promise<void> } = {};

  const middleware: Middleware = ({
    dispatch,
    getState,
  }) => next => async action => {
    if (typeof action === 'function' && isFactoryAction(action.type)) {
      const asyncAction = action({ dispatch, getState, middlewareConfig });

      actions[action.type as string] = asyncAction;

      await asyncAction;

      delete actions[action.type as string];

      return;
    }

    return next(action);
  };

  const toPromise = async () => {
    const prpmises = Object.values(actions);

    for (let index = 0; index < prpmises.length; index++) {
      await prpmises[index];
    }
  };

  return { middleware, toPromise };
};
