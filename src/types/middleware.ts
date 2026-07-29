import { Middleware, Dispatch, UnknownAction } from 'redux';

import { MiddlewareConfig } from './config';

/** A runnable command action created by `requestsFactory`. */
export interface AsyncRequestFactoryAction extends UnknownAction {
  /** Converts the runnable command to the plain action forwarded to Redux. */
  toObject(): unknown;
}

/** Dispatch overload for asynchronous request-factory command actions. */
export interface RequestsFactoryDispatch {
  /**
   * Runs one factory command and resolves when that command finishes.
   * Request failures are normally stored in Redux rather than rethrown.
   */
  (action: AsyncRequestFactoryAction): Promise<void>;
}

/** Creates middleware for one Redux requests factory instance. */
export interface CreateRequestsFactoryMiddleware {
  /**
   * @param config Controls how factory commands interact with the Redux chain.
   * @returns The Redux middleware and aggregate request lifecycle helpers.
   */
  (config?: MiddlewareConfig): {
    /** Middleware that executes request-factory command actions. */
    middleware: Middleware<RequestsFactoryDispatch>;
    /** Resolves after all requests currently tracked by this middleware finish. */
    toPromise: () => Promise<void>;
    /** Cancels every request currently tracked by this middleware. */
    cancelAllRequests: () => Promise<void>;
  };
}

/** Runtime values passed by the middleware to a factory command. @internal */
export interface ActionPropsFromMiddleware<State> {
  /** Redux dispatch from the current store. */
  dispatch: Dispatch;
  /** Returns the current Redux state. */
  getState: () => State;
  /** Normalized middleware configuration. */
  middlewareConfig: MiddlewareConfig;
  /** Returns mutable request runtime state owned by this middleware instance. */
  getRuntimeState<RuntimeState>(
    key: object,
    createState: () => RuntimeState
  ): RuntimeState;
  /** Returns the hydration version for one request-state identity. */
  getRequestHydrationVersion(requestKey: string): number;
  /** Registers one active execution for middleware-wide cancellation. */
  registerRequestCancellation(cancel: () => void): () => void;
}
