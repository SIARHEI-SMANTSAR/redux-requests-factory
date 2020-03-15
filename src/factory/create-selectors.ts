import { createSelector } from 'reselect';

import {
  PreparedConfig,
  RequestFactoryConfig,
  RequestsFactoryItemSelectors,
  RequestsState,
} from '../types';
import { isWithSerialize, getByPath } from './helpers';

const createSelectors = <
  Response,
  Error,
  Params,
  State,
  Config extends RequestFactoryConfig<Response, Params>
>(
  { stateRequestsKey }: PreparedConfig,
  factoryConfig: Config
): RequestsFactoryItemSelectors<Response, Error, Params, State, Config> => {
  const getCommonSate = getByPath<RequestsState, State>(
    stateRequestsKey,
    factoryConfig.stateRequestKey
  );
  if (isWithSerialize<Response, Params>(factoryConfig)) {
    const { serializeRequestParameters } = factoryConfig;
    return {
      responseSelector: createSelector(
        [getCommonSate],
        commonSate => (params?: Params) =>
          getByPath<Response, RequestsState | null>(
            serializeRequestParameters(params),
            'response'
          )(commonSate)
      ),
    } as RequestsFactoryItemSelectors<Response, Error, Params, State, Config>;
  } else {
    return {
      responseSelector: createSelector(
        [getCommonSate],
        getByPath<Response, RequestsState | null>('response')
      ),
    } as RequestsFactoryItemSelectors<Response, Error, Params, State, Config>;
  }
};

export default createSelectors;
