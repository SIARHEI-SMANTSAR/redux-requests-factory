import { connection } from 'next/server';
import { requestsStateSelector } from 'redux-requests-factory';

import RequestsHydrator from '@/app/requests-hydrator';
import Settings from '@/app/settings';
import { loadSettingsAction } from '@/lib/features/settings/settings-requests';
import { makeStore } from '@/lib/store';

export default async function ServerSettings() {
  await connection();

  const store = makeStore();

  store.dispatch(loadSettingsAction());
  await store.asyncRequests();

  return (
    <RequestsHydrator requestsState={requestsStateSelector(store.getState())}>
      <Settings />
    </RequestsHydrator>
  );
}
