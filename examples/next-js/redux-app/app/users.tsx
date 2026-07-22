'use client';

import { useEffect } from 'react';

import {
  forceReloadUsersAction,
  loadUsersAction,
  usersErrorSelector,
  usersLoadingSelector,
  usersSelector,
} from '@/lib/features/users/users-requests';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';

export default function Users() {
  const dispatch = useAppDispatch();
  const users = useAppSelector(usersSelector) ?? [];
  const error = useAppSelector(usersErrorSelector);
  const isLoading = useAppSelector(usersLoadingSelector);

  useEffect(() => {
    dispatch(loadUsersAction());
  }, [dispatch]);

  return (
    <section className="w-full rounded-2xl border border-black/10 bg-white p-8 text-left shadow-sm dark:border-white/15 dark:bg-zinc-900">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            redux-requests-factory
          </p>
          <h2 className="mt-1 text-2xl font-semibold">Users</h2>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="h-10 rounded-full border border-black/15 px-5 font-medium transition-colors hover:bg-zinc-100 disabled:cursor-wait disabled:opacity-50 dark:border-white/20 dark:hover:bg-zinc-800"
            disabled={isLoading}
            onClick={() => dispatch(loadUsersAction())}
          >
            Try cached load
          </button>
          <button
            type="button"
            className="h-10 rounded-full bg-foreground px-5 font-medium text-background transition-opacity hover:opacity-80 disabled:cursor-wait disabled:opacity-50"
            disabled={isLoading}
            onClick={() => dispatch(forceReloadUsersAction())}
          >
            {isLoading ? 'Loading…' : 'Force reload'}
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-2 rounded-xl bg-zinc-100 p-4 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        <p>
          <strong>Try cached load</strong> dispatches{' '}
          <code>loadDataAction</code>. After a successful request, the cached
          result prevents another network request. Open the browser Console: you
          will see the LOAD action, but no REQUEST/START or REQUEST/SUCCESS
          actions after it.
        </p>
        <p>
          <strong>Force reload</strong> dispatches{' '}
          <code>forcedLoadDataAction</code>, ignores the cached result, and
          always performs a new request. The Console will show FORCED_LOAD,
          REQUEST/START, and REQUEST/SUCCESS actions.
        </p>
      </div>

      {error ? (
        <p className="text-red-600 dark:text-red-400">{String(error)}</p>
      ) : null}

      {!error && users.length === 0 ? (
        <p className="text-zinc-500">
          {isLoading ? 'Loading users…' : 'No users found'}
        </p>
      ) : null}

      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {users.map((user) => (
          <li key={user.id} className="flex justify-between gap-4 py-4">
            <span className="font-medium">{user.name}</span>
            <span className="text-zinc-500">{user.role}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
