import { connection } from 'next/server';
import { requestsStateSelector } from 'redux-requests-factory';

import RequestsHydrator from '@/app/requests-hydrator';
import Settings from '@/app/settings';
import { loadSettingsAction } from '@/lib/features/settings/settings-requests';
import { withServerStore } from '@/lib/with-server-store';

export default async function ServerSettings() {
  return withServerStore(async (store) => {
    await connection();
    await store.dispatch(loadSettingsAction());

    return (
      <RequestsHydrator requestsState={requestsStateSelector(store.getState())}>
        <Settings />
      </RequestsHydrator>
    );
  });
}
