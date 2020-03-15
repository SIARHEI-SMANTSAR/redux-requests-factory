import {
  PreparedConfig,
  RequestFactoryConfig,
  RequestsFactoryItemSelectors,
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
  if (isWithSerialize<Response, Params>(factoryConfig)) {
    const { stateRequestKey, serializeRequestParameters } = factoryConfig;

    return {
      responseSelector: (state: State) => (params?: Params) => {
        return getByPath<Response, State>(
          stateRequestsKey,
          stateRequestKey,
          serializeRequestParameters(params)
        )(state);
      },
    } as RequestsFactoryItemSelectors<Response, Error, Params, State, Config>;
  } else {
    const { stateRequestKey } = factoryConfig;

    return {
      responseSelector: (state: State) => {
        return getByPath<Response, State>(
          stateRequestsKey,
          stateRequestKey
        )(state);
      },
    } as RequestsFactoryItemSelectors<Response, Error, Params, State, Config>;
  }
};

export default createSelectors;
