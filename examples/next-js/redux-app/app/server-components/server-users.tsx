import { connection } from 'next/server';
import { requestsStateSelector } from 'redux-requests-factory';

import RequestsHydrator from '@/app/requests-hydrator';
import Users from '@/app/users';
import { loadUsersAction } from '@/lib/features/users/users-requests';
import { makeStore } from '@/lib/store';

export default async function ServerUsers() {
  await connection();

  const store = makeStore();

  store.dispatch(loadUsersAction());
  await store.asyncRequests();

  return (
    <RequestsHydrator requestsState={requestsStateSelector(store.getState())}>
      <Users />
    </RequestsHydrator>
  );
}
