'use client';

import { useEffect } from 'react';

import {
  loadSettingsAction,
  settingsLoadingSelector,
  settingsSelector,
} from '@/lib/features/settings/settings-requests';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';

export default function Settings() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(settingsSelector);
  const isLoading = useAppSelector(settingsLoadingSelector);

  useEffect(() => {
    dispatch(loadSettingsAction());
  }, [dispatch]);

  return (
    <section className="w-full rounded-2xl border border-black/10 bg-white p-8 text-left shadow-sm dark:border-white/15 dark:bg-zinc-900">
      <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
        Settings request
      </p>
      <h2 className="mt-1 text-2xl font-semibold">Settings</h2>

      {isLoading ? (
        <p className="mt-4 text-zinc-500">Loading settings…</p>
      ) : null}

      {settings ? (
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <dt className="text-zinc-500">Language</dt>
          <dd>{settings.language}</dd>
          <dt className="text-zinc-500">Theme</dt>
          <dd>{settings.theme}</dd>
          <dt className="text-zinc-500">Notifications</dt>
          <dd>{settings.notifications ? 'Enabled' : 'Disabled'}</dd>
        </dl>
      ) : null}
    </section>
  );
}
