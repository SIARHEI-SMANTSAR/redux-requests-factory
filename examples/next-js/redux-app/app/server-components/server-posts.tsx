import { connection } from 'next/server';
import { requestsStateSelector } from 'redux-requests-factory';

import Posts from '@/app/posts';
import RequestsHydrator from '@/app/requests-hydrator';
import { loadPostsAction } from '@/lib/features/posts/posts-requests';
import { withServerStore } from '@/lib/with-server-store';

export default async function ServerPosts() {
  return withServerStore(async (store) => {
    await connection();
    await store.dispatch(loadPostsAction());

    return (
      <RequestsHydrator requestsState={requestsStateSelector(store.getState())}>
        <Posts />
      </RequestsHydrator>
    );
  });
}
