import { createSelector } from 'reselect';

import {
  PreparedConfig,
  RequestFactoryConfig,
  RequestsFactoryItemSelectors,
  RequestsState,
  RequestsStatuses,
} from '../../types';
import { isWithSerialize, getByPath, isWithTransformResponse } from './helpers';
import { RESPONSES_STATE_KEY } from '../constants';

const createSelectors = <
  Resp,
  Err,
  Params,
  State,
  TransformedResp,
  Key extends string
>(
  { stateRequestsKey }: PreparedConfig<Key>,
  factoryConfig: RequestFactoryConfig<Resp, Err, Params, State, TransformedResp>
): RequestsFactoryItemSelectors<Resp, Err, Params, State, TransformedResp> => {
  const { stateRequestKey, transformError } = factoryConfig;

  const getCommonSate = getByPath<RequestsState, State>(
    stateRequestsKey,
    RESPONSES_STATE_KEY,
    stateRequestKey
  );

  if (
    isWithSerialize<Resp, Err, Params, State, TransformedResp>(factoryConfig)
  ) {
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
            isWithTransformResponse<Resp, Err, Params, State, TransformedResp>(
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
      requestStatusSelector: createSelector(
        [getCommonSate],
        commonSate => (params: Params) => {
          const status = getByPath<RequestsStatuses, RequestsState | null>(
            serializeRequestParameters(params),
            'status'
          )(commonSate);

          return status || RequestsStatuses.None;
        }
      ),
      isLoadingSelector: createSelector(
        [getCommonSate],
        commonSate => (params: Params) => {
          const status = getByPath<RequestsStatuses, RequestsState | null>(
            serializeRequestParameters(params),
            'status'
          )(commonSate);

          return status === RequestsStatuses.Loading;
        }
      ),
      isLoadedSelector: createSelector(
        [getCommonSate],
        commonSate => (params: Params) => {
          const status = getByPath<RequestsStatuses, RequestsState | null>(
            serializeRequestParameters(params),
            'status'
          )(commonSate);

          return status === RequestsStatuses.Success;
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
          isWithTransformResponse<Resp, Err, Params, State, TransformedResp>(
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
      requestStatusSelector: createSelector([getCommonSate], commonSate => {
        const status = getByPath<RequestsStatuses, RequestsState | null>(
          'status'
        )(commonSate);

        return status || RequestsStatuses.None;
      }),
      isLoadingSelector: createSelector([getCommonSate], commonSate => {
        const status = getByPath<RequestsStatuses, RequestsState | null>(
          'status'
        )(commonSate);

        return status === RequestsStatuses.Loading;
      }),
      isLoadedSelector: createSelector([getCommonSate], commonSate => {
        const status = getByPath<RequestsStatuses, RequestsState | null>(
          'status'
        )(commonSate);

        return status === RequestsStatuses.Success;
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
