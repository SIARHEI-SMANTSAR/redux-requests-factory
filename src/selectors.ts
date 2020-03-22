import { PreparedConfig, GlobalSelectors } from '../types';
import { IS_SOMETHING_LOADING_STATE_KEY } from './constants';

const createGlobalSelectors = <Key extends string>({
  stateRequestsKey,
}: PreparedConfig<Key>): GlobalSelectors => {
  return {
    isSomethingLoadingSelector: <State>(state: State): boolean =>
      (state as any)[stateRequestsKey][IS_SOMETHING_LOADING_STATE_KEY].count >
      0,
  };
};

export default createGlobalSelectors;
