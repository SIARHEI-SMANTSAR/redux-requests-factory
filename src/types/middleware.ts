import { Middleware, Dispatch } from 'redux';

import { MiddlewareConfig } from './config';

export interface CreateRequestsFactoryMiddleware {
  (config?: MiddlewareConfig): {
    middleware: Middleware;
    toPromise: () => Promise<void>;
  };
}

export interface ActionPropsFromMiddleware<State> {
  dispatch: Dispatch;
  getState: () => State;
  middlewareConfig: MiddlewareConfig;
}
