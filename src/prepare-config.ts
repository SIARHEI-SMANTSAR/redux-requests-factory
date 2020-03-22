import { CreateConfig, PreparedConfig } from './types';
import { DEFAULT_STATE_REQUESTS_KEY } from './constants';

const prepareConfig = <Key extends string>(
  config?: CreateConfig<Key>
): PreparedConfig<Key> => ({
  stateRequestsKey: DEFAULT_STATE_REQUESTS_KEY as Key,
  ...config,
});

export default prepareConfig;
