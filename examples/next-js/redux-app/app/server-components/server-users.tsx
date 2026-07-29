import { connection } from 'next/server';
import { requestsStateSelector } from 'redux-requests-factory';

import RequestsHydrator from '@/app/requests-hydrator';
import Users from '@/app/users';
import { loadUsersAction } from '@/lib/features/users/users-requests';
import { withServerStore } from '@/lib/with-server-store';

export default async function ServerUsers() {
  return withServerStore(async (store) => {
    await connection();
    await store.dispatch(loadUsersAction());

    return (
      <RequestsHydrator requestsState={requestsStateSelector(store.getState())}>
        <Users />
      </RequestsHydrator>
    );
  });
}
