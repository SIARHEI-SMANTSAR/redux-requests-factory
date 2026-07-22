'use client';

import { useState } from 'react';
import { Provider } from 'react-redux';

import { makeStore, type RootState } from '@/lib/store';

export default function StoreProvider({
  children,
  preloadedState,
}: Readonly<{
  children: React.ReactNode;
  preloadedState?: RootState;
}>) {
  const [store] = useState(() => makeStore(preloadedState));

  return <Provider store={store}>{children}</Provider>;
}
