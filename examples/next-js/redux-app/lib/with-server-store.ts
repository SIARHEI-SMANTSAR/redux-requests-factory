import { cacheSignal } from 'react';

import { makeStore, type AppStore } from '@/lib/store';

export const withServerStore = async <Result>(
  run: (store: AppStore) => Promise<Result>
): Promise<Result> => {
  const store = makeStore();
  const renderSignal = cacheSignal();
  const cancelRequests = () => void store.cancelAsyncRequests();

  renderSignal?.addEventListener('abort', cancelRequests, { once: true });

  try {
    return await run(store);
  } finally {
    await store.cancelAsyncRequests();
    renderSignal?.removeEventListener('abort', cancelRequests);
  }
};
