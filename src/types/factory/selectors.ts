export type RequestsFactoryItemSelectors<Response, _Error, _Params, State> = {
  responseSelector: (state: State) => Response | null;
};
