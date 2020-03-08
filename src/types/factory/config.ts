export type RequestFactoryConfig<Response, Params> = {
  request: (params?: Params) => Promise<Response>;
  stateRequestKey: string;
};
