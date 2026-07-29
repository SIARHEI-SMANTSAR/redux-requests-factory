import { Middleware } from 'redux';

import {
  AsyncRequestFactoryAction,
  PreparedConfig,
  CreateRequestsFactoryMiddleware,
  MiddlewareConfig,
  RequestsFactoryDispatch,
  ActionPropsFromMiddleware,
  GlobalActionTypes,
  HydrateRequestsAction,
  RequestState,
} from './types';
import { RESPONSES_STATE_KEY } from './constants';
import { getRequestKey, isFactoryAction } from './factory/helpers';

type RunnableFactoryAction = AsyncRequestFactoryAction & {
  forwardFactoryAction?: boolean;
  type: string;
  (params: ActionPropsFromMiddleware<unknown>): void | Promise<void>;
};

export const getCreateRequestsFactoryMiddleware =
  <Key extends string>(
    config: PreparedConfig<Key>
  ): CreateRequestsFactoryMiddleware =>
  (middlewareConfig: MiddlewareConfig = {}) => {
    config.resetRegisterRequestKey();

    const actions: Set<Promise<void>> = new Set();
    // Cached settled Promises may be dispatched again during React render.
    // Keep them out of active request aggregation after their first settlement.
    const settledActions = new WeakSet<Promise<void>>();
    const requestCancellations = new Set<() => void>();
    // Each request identity has its own hydration generation. A generation is
    // incremented only when that identity is imported by hydrateRequestsAction,
    // so hydrating one serialized key cannot unlock a retry for another key.
    // Initial preloaded state implicitly belongs to generation 0.
    const requestHydrationVersions = new Map<string, number>();
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
    const getRequestHydrationVersion = (requestKey: string) =>
      requestHydrationVersions.get(requestKey) ?? 0;
    const incrementRequestHydrationVersion = (requestKey: string) => {
      requestHydrationVersions.set(
        requestKey,
        getRequestHydrationVersion(requestKey) + 1
      );
    };
    const isRequestState = (
      value: RequestState | Record<string, RequestState>
    ): value is RequestState =>
      'status' in value && typeof value.status === 'string';
    const recordHydratedRequests = (action: HydrateRequestsAction<Key>) => {
      const responses = action.payload[RESPONSES_STATE_KEY];

      Object.keys(responses).forEach((key) => {
        const requestStateOrSerializedStates = responses[key];

        // A request without serializeRequestParameters stores RequestState
        // directly. A serialized request stores one RequestState per
        // serialized parameter key, and each entry is a separate identity.
        if (isRequestState(requestStateOrSerializedStates)) {
          incrementRequestHydrationVersion(getRequestKey({ key }));
          return;
        }

        Object.keys(requestStateOrSerializedStates).forEach((serializedKey) => {
          incrementRequestHydrationVersion(
            getRequestKey({ key, serializedKey })
          );
        });
      });
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
                getRequestHydrationVersion,
                registerRequestCancellation,
              })
            );
          } catch (error) {
            asyncAction = Promise.reject(error);
          }

          if (!settledActions.has(asyncAction) && !actions.has(asyncAction)) {
            actions.add(asyncAction);
            aggregatePromise = undefined;
            asyncAction.then(
              () => {
                settledActions.add(asyncAction);
                actions.delete(asyncAction);
              },
              () => {
                settledActions.add(asyncAction);
                actions.delete(asyncAction);
              }
            );
          }

          return asyncAction;
        }

        const result = next(action);

        if (
          typeof action === 'object' &&
          action !== null &&
          'type' in action &&
          action.type === GlobalActionTypes.HydrateRequests
        ) {
          const hydrateAction = action as HydrateRequestsAction<Key>;

          if (hydrateAction.meta.stateRequestsKey === config.stateRequestsKey) {
            // Record generations after reducers have merged the payload. The
            // next loadDataAction can then recognize the new hydrated state.
            recordHydratedRequests(hydrateAction);
          }
        }

        return result;
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
