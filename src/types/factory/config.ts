export interface RequestFactoryConfigWithoutSerialize<Response, Params> {
  request: (params?: Params) => Promise<Response>;
  stateRequestKey: string;
}

export interface RequestFactoryConfigWithSerialize<Response, Params>
  extends RequestFactoryConfigWithoutSerialize<Response, Params> {
  serializeRequestParameters: (params?: Params) => string;
}

export type RequestFactoryConfig<Response, Params> =
  | RequestFactoryConfigWithoutSerialize<Response, Params>
  | RequestFactoryConfigWithSerialize<Response, Params>;
