import type { RequestsState } from './reducer';

export interface IsSomethingLoadingSelector {
  <State>(state: State): boolean;
}

export interface RequestsStateSelector<Key extends string> {
  <State extends Record<Key, RequestsState>>(state: State): RequestsState;
}

export type GlobalSelectors<Key extends string> = {
  isSomethingLoadingSelector: IsSomethingLoadingSelector;
  requestsStateSelector: RequestsStateSelector<Key>;
};
