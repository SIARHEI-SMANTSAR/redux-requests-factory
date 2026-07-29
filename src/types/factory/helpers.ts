/** Runtime state owned by one active request execution. @internal */
export type ActiveRequestState = {
  abortController?: AbortController;
  canceled: boolean;
  globalLoadingDecrementedAfterTimeout: boolean;
  globalLoadingTimeoutId?: ReturnType<typeof setTimeout>;
  cancel?: () => void;
  resolveCancellation: () => void;
  silent: boolean;
};

/** Tracks active request executions by request key and request number. @internal */
export type DoRequestMapByKey = Map<string, Map<number, ActiveRequestState>>;
