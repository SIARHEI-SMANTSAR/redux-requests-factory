import { connection } from 'next/server';
import { requestsStateSelector } from 'redux-requests-factory';

import Posts from '@/app/posts';
import RequestsHydrator from '@/app/requests-hydrator';
import Settings from '@/app/settings';
import Users from '@/app/users';
import { loadPostsAction } from '@/lib/features/posts/posts-requests';
import { loadSettingsAction } from '@/lib/features/settings/settings-requests';
import { loadUsersAction } from '@/lib/features/users/users-requests';
import { makeStore } from '@/lib/store';

export default async function ServerReduxBatchPage() {
  await connection();

  const store = makeStore();

  store.dispatch(loadUsersAction());
  store.dispatch(loadPostsAction());
  store.dispatch(loadSettingsAction());

  await store.asyncRequests();

  return (
    <RequestsHydrator requestsState={requestsStateSelector(store.getState())}>
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
        <main className="flex w-full max-w-2xl flex-col items-center gap-10 py-24 text-center">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
              One server store, three requests
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">
              Batched server loading
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              All requests start together. The page waits once for
              store.asyncRequests() and hydrates the resulting requests state
              into the shared layout store.
            </p>
          </div>

          <Users />
          <Posts />
          <Settings />
        </main>
      </div>
    </RequestsHydrator>
  );
}
