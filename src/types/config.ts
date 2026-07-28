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
   * Enabling this globally forwards every factory command through the rest of
   * the Redux chain. This adds unnecessary processing, can degrade application
   * performance, and creates action-stream noise. Prefer
   * `forwardFactoryAction: true` on only the individual commands that external
   * middleware or reducers need to observe. Use the global option primarily as
   * a temporary v1 compatibility measure.
   *
   * @default false
   */
  forwardFactoryActions?: boolean;
};
