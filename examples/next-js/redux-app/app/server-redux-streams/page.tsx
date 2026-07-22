import { Suspense } from 'react';

import ServerPosts from '@/app/server-components/server-posts';
import ServerSettings from '@/app/server-components/server-settings';
import ServerUsers from '@/app/server-components/server-users';

const fallbackClassName =
  'w-full rounded-2xl border border-black/10 bg-white p-8 text-left text-zinc-500 shadow-sm dark:border-white/15 dark:bg-zinc-900';

export default function ServerReduxStreamsPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-10 py-24 text-center">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            Three stores, three streams
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Independent Server Components
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Users, posts, and settings load in separate async Server Components.
            Each Suspense boundary can stream as soon as its own request is
            ready.
          </p>
        </div>

        <Suspense
          fallback={<div className={fallbackClassName}>Loading users…</div>}
        >
          <ServerUsers />
        </Suspense>

        <Suspense
          fallback={<div className={fallbackClassName}>Loading posts…</div>}
        >
          <ServerPosts />
        </Suspense>

        <Suspense
          fallback={<div className={fallbackClassName}>Loading settings…</div>}
        >
          <ServerSettings />
        </Suspense>
      </main>
    </div>
  );
}
