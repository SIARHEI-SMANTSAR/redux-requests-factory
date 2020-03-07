import {
  RequestsFactoryItemSelectors,
  PreparedConfig,
  RequestFactoryConfig,
} from '../types';

const createSelectors = <Response, Error, Params, State>(
  { stateRequestsKey }: PreparedConfig,
  { stateRequestKey }: RequestFactoryConfig<Response, Params>
): RequestsFactoryItemSelectors<Response, Error, Params, State> => {
  return {
    responseSelector: (state: State): Response | null =>
      (state &&
        (state as any)[stateRequestsKey] &&
        ((state as any)[stateRequestsKey] as any)[stateRequestKey]) ||
      null,
  };
};

export default createSelectors;
