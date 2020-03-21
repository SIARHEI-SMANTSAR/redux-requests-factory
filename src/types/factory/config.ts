export interface RequestFactoryConfigCommon {
  stateRequestKey: string;
  useDebounce?: boolean;
  debounceWait?: number;
  debounceOptions?: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  };
}

export type RequestFactoryConfigWithOptionalParamsWithoutSerialize<
  Resp,
  Params
> = RequestFactoryConfigCommon & {
  request: (params?: Params) => Promise<Resp>;
  stringifyParamsForDebounce?: (params?: Params) => string;
};

export type RequestFactoryConfigWithParamsWithoutSerialize<
  Resp,
  Params
> = RequestFactoryConfigCommon & {
  request: (params: Params) => Promise<Resp>;
  stringifyParamsForDebounce?: (params: Params) => string;
};

export type RequestFactoryConfigWithParamsWithSerialize<
  Resp,
  Params
> = RequestFactoryConfigCommon & {
  request: (params: Params) => Promise<Resp>;
  stringifyParamsForDebounce?: (params: Params) => string;
  serializeRequestParameters: (params: Params) => string;
};

export type RequestFactoryConfig<Resp, Params> =
  | RequestFactoryConfigWithOptionalParamsWithoutSerialize<Resp, Params>
  | RequestFactoryConfigWithParamsWithoutSerialize<Resp, Params>
  | RequestFactoryConfigWithParamsWithSerialize<Resp, Params>;
