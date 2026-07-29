import { connection } from 'next/server';
import { Suspense } from 'react';
import {
  requestsStateSelector,
  type RequestsState,
} from 'redux-requests-factory';

import RequestsPromise from '@/app/requests-promise';
import Users from '@/app/users';
import { loadUsersAction } from '@/lib/features/users/users-requests';
import { withServerStore } from '@/lib/with-server-store';

async function loadUsersRequestsState(): Promise<RequestsState> {
  return withServerStore(async (store) => {
    await connection();
    await store.dispatch(loadUsersAction());

    return requestsStateSelector(store.getState());
  });
}

export default function ServerReduxUsePage() {
  const requestsStatePromise = loadUsersRequestsState();

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-10 py-24 text-center">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            React use(promise) + Redux
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Streaming a requests-state promise
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            The Server Component starts loading without awaiting. A Client
            Component reads the promise with use(), suspends, and hydrates the
            completed Redux requests state.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="w-full rounded-2xl border border-black/10 bg-white p-8 text-left text-zinc-500 shadow-sm dark:border-white/15 dark:bg-zinc-900">
              Reading the requests-state promise…
            </div>
          }
        >
          <RequestsPromise requestsStatePromise={requestsStatePromise}>
            <Users />
          </RequestsPromise>
        </Suspense>
      </main>
    </div>
  );
}
