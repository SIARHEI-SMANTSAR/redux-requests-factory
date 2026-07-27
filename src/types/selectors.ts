import type { RequestsState } from './reducer';

/** Selects whether at least one included request is globally loading. */
export interface IsSomethingLoadingSelector {
  <State>(state: State): boolean;
}

/** Selects the complete requests slice for SSR serialization and hydration. */
export interface RequestsStateSelector<Key extends string> {
  <State extends Record<Key, RequestsState>>(state: State): RequestsState;
}

/** Global selectors exposed by a Redux requests factory instance. */
export type GlobalSelectors<Key extends string> = {
  /** Returns whether at least one included request is globally loading. */
  isSomethingLoadingSelector: IsSomethingLoadingSelector;
  /** Returns the complete requests slice without its root-state key. */
  requestsStateSelector: RequestsStateSelector<Key>;
};
