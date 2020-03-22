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
): RequestsFactory<Key> =>
  (<Resp, Err, Params, State, TransformedResp = Resp>(
    config: RequestFactoryConfig<Resp, Err, Params, State, TransformedResp>
  ): RequestsFactoryItem<Resp, Err, Params, State, TransformedResp> => {
    const patchedConfig = patchConfig(config);

    return {
      ...createActions<Resp, Err, Params, State, TransformedResp, Key>(
        preparedConfig,
        patchedConfig
      ),
      ...createSelectors<Resp, Err, Params, State, TransformedResp, Key>(
        preparedConfig,
        patchedConfig
      ),
    } as RequestsFactoryItem<Resp, Err, Params, State, TransformedResp>;
  }) as RequestsFactory<Key>;
