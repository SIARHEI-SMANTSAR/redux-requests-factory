import { createSelector } from 'reselect';

import {
  PreparedConfig,
  RequestFactoryConfig,
  RequestsFactoryItemSelectors,
  RequestsState,
} from '../../types';
import { isWithSerialize, getByPath, isWithTransformResponse } from './helpers';

const createSelectors = <
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
  Key extends string
>(
  { stateRequestsKey }: PreparedConfig<Key>,
  factoryConfig: RequestFactoryConfig<Resp, Err, Params, TransformedResp>
): RequestsFactoryItemSelectors<Resp, Err, Params, State, TransformedResp> => {
  const { stateRequestKey, transformError } = factoryConfig;

  const getCommonSate = getByPath<RequestsState, State>(
    stateRequestsKey,
    stateRequestKey
  );

  if (isWithSerialize<Resp, Err, Params, TransformedResp>(factoryConfig)) {
    const { serializeRequestParameters } = factoryConfig;
    return {
      responseSelector: createSelector(
        [getCommonSate],
        commonSate => (params: Params) => {
          const response = getByPath<Resp, RequestsState | null>(
            serializeRequestParameters(params),
            'response'
          )(commonSate);

          if (
            isWithTransformResponse<Resp, Err, Params, TransformedResp>(
              factoryConfig
            )
          ) {
            return factoryConfig.transformResponse(response);
          }

          return response;
        }
      ),
      errrorSelector: createSelector(
        [getCommonSate],
        commonSate => (params: Params) => {
          const error = getByPath<Err, RequestsState | null>(
            serializeRequestParameters(params),
            'error'
          )(commonSate);

          if (transformError) {
            return transformError(error);
          }

          return error;
        }
      ),
    } as RequestsFactoryItemSelectors<
      Resp,
      Err,
      Params,
      State,
      TransformedResp
    >;
  } else {
    return {
      responseSelector: createSelector([getCommonSate], commonSate => {
        const response = getByPath<Resp, RequestsState | null>('response')(
          commonSate
        );

        if (
          isWithTransformResponse<Resp, Err, Params, TransformedResp>(
            factoryConfig
          )
        ) {
          return factoryConfig.transformResponse(response);
        }

        return response;
      }),
      errrorSelector: createSelector([getCommonSate], commonSate => {
        const error = getByPath<Err, RequestsState | null>('error')(commonSate);

        if (transformError) {
          return transformError(error);
        }

        return error;
      }),
    } as RequestsFactoryItemSelectors<
      Resp,
      Err,
      Params,
      State,
      TransformedResp
    >;
  }
};

export default createSelectors;
