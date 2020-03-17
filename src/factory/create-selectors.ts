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
  Config extends RequestFactoryConfig<Resp, Params>
>(
  { stateRequestsKey }: PreparedConfig,
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
    } as RequestsFactoryItemSelectors<Resp, Err, Params, State, Config>;
  } else {
    return {
      responseSelector: createSelector(
        [getCommonSate],
        getByPath<Resp, RequestsState | null>('response')
      ),
    } as RequestsFactoryItemSelectors<Resp, Err, Params, State, Config>;
  }
};

export default createSelectors;
