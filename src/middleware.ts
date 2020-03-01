import { Middleware } from 'redux';

export const reduxRequestsFactoryMiddleware = (_config = {}): Middleware => {
  return _api => _next => _action => {
    // TODO
  };
};
