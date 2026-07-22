import { PreparedConfig, GlobalSelectors, RequestsState } from './types';
import { IS_SOMETHING_LOADING_STATE_KEY } from './constants';

const createGlobalSelectors = <Key extends string>({
  stateRequestsKey,
}: PreparedConfig<Key>): GlobalSelectors<Key> => {
  return {
    isSomethingLoadingSelector: <State>(state: State): boolean =>
      (state as any)[stateRequestsKey][IS_SOMETHING_LOADING_STATE_KEY].count >
      0,
    requestsStateSelector: <State extends Record<Key, RequestsState>>(
      state: State
    ): RequestsState => state[stateRequestsKey],
  };
};

export default createGlobalSelectors;
