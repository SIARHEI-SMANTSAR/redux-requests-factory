export interface IsSomethingLoadingSelector {
  <State>(state: State): boolean;
}

export type GlobalSelectors = {
  isSomethingLoadingSelector: IsSomethingLoadingSelector;
};
