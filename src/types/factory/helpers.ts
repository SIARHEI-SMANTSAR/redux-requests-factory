/** Tracks active request numbers and their cancellation markers by request key. @internal */
export type DoRequestMapByKey = Map<string, Map<number, { canceled: boolean }>>;
