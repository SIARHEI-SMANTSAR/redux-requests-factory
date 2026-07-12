import { Middleware } from 'redux';

import {
  PreparedConfig,
  CreateRequestsFactoryMiddleware,
  MiddlewareConfig,
} from './types';
import { isFactoryAction } from './factory/helpers';

type RunnableFactoryAction = {
  type: string;
  toObject: () => unknown;
  (params: {
    dispatch: Parameters<Middleware>[0]['dispatch'];
    getState: Parameters<Middleware>[0]['getState'];
    middlewareConfig: MiddlewareConfig;
  }): Promise<void>;
};

export const getCreateRequestsFactoryMiddleware =
  <Key>(config: PreparedConfig<Key>): CreateRequestsFactoryMiddleware =>
  (middlewareConfig: MiddlewareConfig = {}) => {
    config.resetRegisterRequestKey();

    const actions: Set<Promise<void>> = new Set();

    const middleware: Middleware =
      ({ dispatch, getState }) =>
      (next) =>
      async (action) => {
        if (typeof action === 'function') {
          const factoryAction = action as RunnableFactoryAction;

          if (!isFactoryAction(factoryAction.type)) {
            return next(action);
          }

          next(factoryAction.toObject());

          const asyncAction = factoryAction({
            dispatch,
            getState,
            middlewareConfig,
          });

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
