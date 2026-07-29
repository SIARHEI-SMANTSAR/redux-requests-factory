import { requestsFactory, type RequestContext } from 'redux-requests-factory';

import { getPosts, type Post } from '@/lib/posts-data';

export type { Post };

const loadPostsRequest = async (
  _params: undefined,
  { signal }: RequestContext
): Promise<Post[]> => {
  if (typeof window === 'undefined') {
    return getPosts(signal);
  }

  const response = await fetch('/api/posts', { signal });

  if (!response.ok) {
    throw new Error('Failed to load posts');
  }

  return response.json() as Promise<Post[]>;
};

export const {
  isLoadingSelector: postsLoadingSelector,
  loadDataAction: loadPostsAction,
  responseSelector: postsSelector,
} = requestsFactory({
  request: loadPostsRequest,
  stateRequestKey: 'posts',
});
