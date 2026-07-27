/** Configuration for creating an independent Redux requests factory. */
export type CreateConfig<Key> = {
  /** Redux state key under which this factory's request state is mounted. @default 'requests' */
  stateRequestsKey?: Key;
};

/** Internal normalized configuration shared by a factory instance. */
export type PreparedConfig<Key> = {
  /** Redux state key under which this factory's request state is mounted. */
  stateRequestsKey: Key;
  /** Registers and, when necessary, disambiguates a request-state key. */
  registerRequestKey: (key: string) => string;
  /** Clears request-key registrations before a middleware instance is created. */
  resetRegisterRequestKey: () => void;
};

/** Configuration accepted by `createRequestsFactoryMiddleware`. */
export type MiddlewareConfig = {
  /**
   * Whether factory command actions are forwarded as plain Redux actions to
   * later middleware and reducers. Internal request-state actions are always
   * dispatched.
   *
   * @default true
   */
  forwardFactoryActions?: boolean;
};
