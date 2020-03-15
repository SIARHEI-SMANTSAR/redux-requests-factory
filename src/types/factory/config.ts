export interface RequestFactoryConfigWithoutSerialize<Response, Params> {
  request: (params?: Params) => Promise<Response>;
  stateRequestKey: string;
  useDebounce?: boolean;
  debounceWait?: number;
  debounceOptions?: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  };
  stringifyParamsForDebounce?: (params?: Params) => string;
}

export interface RequestFactoryConfigWithSerialize<Response, Params>
  extends RequestFactoryConfigWithoutSerialize<Response, Params> {
  serializeRequestParameters: (params?: Params) => string;
}

export type RequestFactoryConfig<Response, Params> =
  | RequestFactoryConfigWithoutSerialize<Response, Params>
  | RequestFactoryConfigWithSerialize<Response, Params>;
