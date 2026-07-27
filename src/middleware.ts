import { Middleware } from 'redux';

import {
  AsyncRequestFactoryAction,
  PreparedConfig,
  CreateRequestsFactoryMiddleware,
  MiddlewareConfig,
  RequestsFactoryDispatch,
} from './types';
import { isFactoryAction } from './factory/helpers';

type RunnableFactoryAction = AsyncRequestFactoryAction & {
  forwardFactoryAction?: boolean;
  type: string;
  (params: {
    dispatch: Parameters<Middleware>[0]['dispatch'];
    getState: Parameters<Middleware>[0]['getState'];
    middlewareConfig: MiddlewareConfig;
  }): void | Promise<void>;
};

export const getCreateRequestsFactoryMiddleware =
  <Key>(config: PreparedConfig<Key>): CreateRequestsFactoryMiddleware =>
  (middlewareConfig: MiddlewareConfig = {}) => {
    config.resetRegisterRequestKey();

    const actions: Set<Promise<void>> = new Set();

    const middleware: Middleware<RequestsFactoryDispatch> =
      ({ dispatch, getState }) =>
      (next) =>
      (action) => {
        if (typeof action === 'function') {
          const factoryAction = action as RunnableFactoryAction;

          if (!isFactoryAction(factoryAction.type)) {
            return next(action);
          }

          const forwardFactoryAction =
            factoryAction.forwardFactoryAction ??
            middlewareConfig.forwardFactoryActions ??
            true;

          if (forwardFactoryAction) {
            next(factoryAction.toObject());
          }

          let asyncAction: Promise<void>;

          try {
            asyncAction = Promise.resolve(
              factoryAction({
                dispatch,
                getState,
                middlewareConfig,
              })
            );
          } catch (error) {
            asyncAction = Promise.reject(error);
          }

          if (!actions.has(asyncAction)) {
            actions.add(asyncAction);
            asyncAction.then(
              () => {
                actions.delete(asyncAction);
              },
              () => {
                actions.delete(asyncAction);
              }
            );
          }

          return asyncAction;
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
