import { connection } from 'next/server';
import { requestsStateSelector } from 'redux-requests-factory';

import Posts from '@/app/posts';
import RequestsHydrator from '@/app/requests-hydrator';
import { loadPostsAction } from '@/lib/features/posts/posts-requests';
import { makeStore } from '@/lib/store';

export default async function ServerPosts() {
  await connection();

  const store = makeStore();

  store.dispatch(loadPostsAction());
  await store.asyncRequests();

  return (
    <RequestsHydrator requestsState={requestsStateSelector(store.getState())}>
      <Posts />
    </RequestsHydrator>
  );
}
