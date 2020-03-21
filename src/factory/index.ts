import {
  PreparedConfig,
  RequestsFactory,
  RequestsFactoryItem,
  RequestFactoryConfig,
} from '../types';
import createActions from './create-actions';
import createSelectors from './create-selectors';
import { patchConfig } from './helpers';

export const createRequestsFactory = <Key extends string>(
  preparedConfig: PreparedConfig<Key>
): RequestsFactory =>
  (<Resp, Err, Params, State>(
    config: RequestFactoryConfig<Resp, Params>
  ): RequestsFactoryItem<Resp, Err, Params, State> => {
    const patchedConfig = patchConfig(config);

    return {
      ...createActions(preparedConfig, patchedConfig),
      ...createSelectors<Resp, Err, Params, State, Key>(
        preparedConfig,
        patchedConfig
      ),
    } as RequestsFactoryItem<Resp, Err, Params, State>;
  }) as RequestsFactory;
