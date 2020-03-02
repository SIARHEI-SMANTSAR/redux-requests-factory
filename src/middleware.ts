import { Middleware } from 'redux';

import { PreparedConfig } from './types';

export const createRequestsFactoryMiddleware = ({
  stateRequestsKey,
}: PreparedConfig): Middleware => {
  return _api => _next => _action => {
    console.log(stateRequestsKey);
    // TODO
  };
};
