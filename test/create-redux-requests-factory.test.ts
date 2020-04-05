import createReduxRequestsFactory from '../src';
import { DEFAULT_STATE_REQUESTS_KEY } from '../src/constants';

describe('create-redux-requests-factory', () => {
  it('stateRequestsKey should be default value if config.stateRequestsKey is empty', () => {
    const config = {};

    const { stateRequestsKey } = createReduxRequestsFactory(config);

    expect(stateRequestsKey).toEqual(DEFAULT_STATE_REQUESTS_KEY);
  });

  it('stateRequestsKey should be config.stateRequestsKey', () => {
    const config = {
      stateRequestsKey: 'api',
    };

    const { stateRequestsKey } = createReduxRequestsFactory(config);

    expect(stateRequestsKey).toEqual('api');
  });
});
