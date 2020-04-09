import { Middleware } from 'redux';

import {
  PreparedConfig,
  CreateRequestsFactoryMiddleware,
  MiddlewareConfig,
} from './types';
import { isFactoryAction } from './factory/helpers';

export const getCreateRequestsFactoryMiddleware = <Key>(
  _config: PreparedConfig<Key>
): CreateRequestsFactoryMiddleware => (
  middlewareConfig: MiddlewareConfig = {}
) => {
  const actions: Set<Promise<void>> = new Set();

  const middleware: Middleware = ({
    dispatch,
    getState,
  }) => next => async action => {
    if (typeof action === 'function' && isFactoryAction(action.type)) {
      const asyncAction = action({ dispatch, getState, middlewareConfig });

      actions.add(asyncAction);

      await asyncAction;

      actions.delete(asyncAction);

      return;
    }

    return next(action);
  };

  const toPromise = async () => {
    for (let action of actions) {
      await action;
    }
  };

  return { middleware, toPromise };
};
