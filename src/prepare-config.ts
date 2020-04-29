import { CreateConfig, PreparedConfig } from './types';
import { DEFAULT_STATE_REQUESTS_KEY } from './constants';
import createRegisterRequestKey from './create-register-request-key';

const prepareConfig = <Key extends string>(
  config?: CreateConfig<Key>
): PreparedConfig<Key> => ({
  stateRequestsKey: DEFAULT_STATE_REQUESTS_KEY as Key,
  ...createRegisterRequestKey(),
  ...config,
});

export default prepareConfig;
