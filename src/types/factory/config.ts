export interface RequestFactoryConfigWithoutSerialize<Resp, Params> {
  request: (params?: Params) => Promise<Resp>;
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

export interface RequestFactoryConfigWithSerialize<Resp, Params>
  extends RequestFactoryConfigWithoutSerialize<Resp, Params> {
  serializeRequestParameters: (params?: Params) => string;
}

export type RequestFactoryConfig<Resp, Params> =
  | RequestFactoryConfigWithoutSerialize<Resp, Params>
  | RequestFactoryConfigWithSerialize<Resp, Params>;
