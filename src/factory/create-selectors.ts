import { createSelector } from 'reselect';

import {
  PreparedConfig,
  RequestFactoryConfig,
  RequestsFactoryItemSelectors,
  RequestsState,
} from '../types';
import { isWithSerialize, getByPath } from './helpers';

const createSelectors = <
  Resp,
  Err,
  Params,
  State,
  Config extends RequestFactoryConfig<Resp, Params>,
  Key extends string
>(
  { stateRequestsKey }: PreparedConfig<Key>,
  factoryConfig: Config
): RequestsFactoryItemSelectors<Resp, Err, Params, State, Config> => {
  const getCommonSate = getByPath<RequestsState, State>(
    stateRequestsKey,
    factoryConfig.stateRequestKey
  );
  if (isWithSerialize<Resp, Params>(factoryConfig)) {
    const { serializeRequestParameters } = factoryConfig;
    return {
      responseSelector: createSelector(
        [getCommonSate],
        commonSate => (params?: Params) =>
          getByPath<Resp, RequestsState | null>(
            serializeRequestParameters(params),
            'response'
          )(commonSate)
      ),
      errrorSelector: createSelector(
        [getCommonSate],
        commonSate => (params?: Params) =>
          getByPath<Err, RequestsState | null>(
            serializeRequestParameters(params),
            'error'
          )(commonSate)
      ),
    } as RequestsFactoryItemSelectors<Resp, Err, Params, State, Config>;
  } else {
    return {
      responseSelector: createSelector(
        [getCommonSate],
        getByPath<Resp, RequestsState | null>('response')
      ),
      errrorSelector: createSelector(
        [getCommonSate],
        getByPath<Err, RequestsState | null>('error')
      ),
    } as RequestsFactoryItemSelectors<Resp, Err, Params, State, Config>;
  }
};

export default createSelectors;
