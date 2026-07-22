import { Suspense } from 'react';

import ServerUsers from '@/app/server-components/server-users';

export default function ServerReduxPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-10 py-24 text-center">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            redux-requests-factory on the server
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Async Server Component + Redux
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            The page renders immediately. Only the users component waits for
            store.asyncRequests() inside its Suspense boundary.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="w-full rounded-2xl border border-black/10 bg-white p-8 text-left text-zinc-500 shadow-sm dark:border-white/15 dark:bg-zinc-900">
              Loading users on the server…
            </div>
          }
        >
          <ServerUsers />
        </Suspense>
      </main>
    </div>
  );
}
