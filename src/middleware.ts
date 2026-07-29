import { Middleware } from 'redux';

import {
  AsyncRequestFactoryAction,
  PreparedConfig,
  CreateRequestsFactoryMiddleware,
  MiddlewareConfig,
  RequestsFactoryDispatch,
  ActionPropsFromMiddleware,
} from './types';
import { isFactoryAction } from './factory/helpers';

type RunnableFactoryAction = AsyncRequestFactoryAction & {
  forwardFactoryAction?: boolean;
  type: string;
  (params: ActionPropsFromMiddleware<unknown>): void | Promise<void>;
};

export const getCreateRequestsFactoryMiddleware =
  <Key>(config: PreparedConfig<Key>): CreateRequestsFactoryMiddleware =>
  (middlewareConfig: MiddlewareConfig = {}) => {
    config.resetRegisterRequestKey();

    const actions: Set<Promise<void>> = new Set();
    const requestCancellations = new Set<() => void>();
    let aggregatePromise: Promise<void> | undefined;
    const runtimeStateByFactory = new WeakMap<object, unknown>();
    const getRuntimeState = <RuntimeState>(
      key: object,
      createState: () => RuntimeState
    ): RuntimeState => {
      if (!runtimeStateByFactory.has(key)) {
        runtimeStateByFactory.set(key, createState());
      }

      return runtimeStateByFactory.get(key) as RuntimeState;
    };
    const registerRequestCancellation = (cancel: () => void) => {
      requestCancellations.add(cancel);

      return () => {
        requestCancellations.delete(cancel);
      };
    };

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
            false;

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
                getRuntimeState,
                registerRequestCancellation,
              })
            );
          } catch (error) {
            asyncAction = Promise.reject(error);
          }

          if (!actions.has(asyncAction)) {
            actions.add(asyncAction);
            aggregatePromise = undefined;
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

    const toPromise = () => {
      aggregatePromise ??= (async () => {
        for (let action of actions) {
          await action;
        }
      })();

      return aggregatePromise;
    };

    const cancelAllRequests = async () => {
      const trackedActions = Array.from(actions);

      Array.from(requestCancellations).forEach((cancel) => cancel());

      await Promise.all(trackedActions);
    };

    return { cancelAllRequests, middleware, toPromise };
  };
