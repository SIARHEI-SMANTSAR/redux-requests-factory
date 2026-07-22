'use client';

import { useLayoutEffect } from 'react';
import {
  hydrateRequestsAction,
  type RequestsState,
} from 'redux-requests-factory';

import { useAppStore } from '@/lib/hooks';

export default function RequestsHydrator({
  children,
  requestsState,
}: Readonly<{
  children: React.ReactNode;
  requestsState: RequestsState;
}>) {
  const store = useAppStore();

  useLayoutEffect(() => {
    store.dispatch(hydrateRequestsAction(requestsState));
  }, [requestsState, store]);

  return children;
}
