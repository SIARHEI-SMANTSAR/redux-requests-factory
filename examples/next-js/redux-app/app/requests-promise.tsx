'use client';

import { use, type ReactNode } from 'react';
import type { RequestsState } from 'redux-requests-factory';

import RequestsHydrator from '@/app/requests-hydrator';

export default function RequestsPromise({
  children,
  requestsStatePromise,
}: Readonly<{
  children: ReactNode;
  requestsStatePromise: Promise<RequestsState>;
}>) {
  const requestsState = use(requestsStatePromise);

  return (
    <RequestsHydrator requestsState={requestsState}>
      {children}
    </RequestsHydrator>
  );
}
