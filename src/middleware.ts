import { Middleware } from 'redux';

import { DEFAULT_STATE_API_KEY } from './constants';

type MiddlewareConfig = {
  stateApiKey?: string;
};

export const createRequestsFactoryMiddleware = ({
  stateApiKey = DEFAULT_STATE_API_KEY,
}: MiddlewareConfig = {}): Middleware => {
  return _api => _next => _action => {
    console.log(stateApiKey);
    // TODO
  };
};

export const requestsFactoryMiddleware = createRequestsFactoryMiddleware();
