import { requestsFactory } from 'redux-requests-factory';

import { getPosts, type Post } from '@/lib/posts-data';

export type { Post };

const loadPostsRequest = async (): Promise<Post[]> => {
  if (typeof window === 'undefined') {
    return getPosts();
  }

  const response = await fetch('/api/posts');

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
