export type CreateConfig<Key> = {
  stateRequestsKey?: Key;
};

export type PreparedConfig<Key> = {
  stateRequestsKey: Key;
  registerRequestKey: (key: string) => string;
  resetRegisterRequestKey: () => void;
};

export type MiddlewareConfig = {};
