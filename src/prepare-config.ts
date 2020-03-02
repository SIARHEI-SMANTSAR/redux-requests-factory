import { Config, PreparedConfig } from './types';
import { DEFAULT_STATE_REQUESTS_KEY } from './constants';

const prepareConfig = (config?: Config): PreparedConfig => ({
  stateRequestsKey: DEFAULT_STATE_REQUESTS_KEY,
  ...config,
});

export default prepareConfig;
