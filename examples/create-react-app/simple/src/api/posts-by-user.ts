import { requestsFactory } from 'redux-requests-factory';

interface Post {
  id: number;
  title: string;
}

interface Params {
  userId: number;
}

const loadUserPostsRequest = ({ userId }: Params): Promise<Post[]> =>
  fetch(
    `https://jsonplaceholder.typicode.com/posts?userId=${userId}`
  ).then(res => res.json());

export const {
  loadDataAction: loadUserPostsAction,
  responseSelector: userPostsSelector,
} = requestsFactory({
  request: loadUserPostsRequest,
  stateRequestKey: 'user-posts',
  serializeRequestParameters: ({ userId }: Params) => `${userId}`,
  transformResponse: (response: Post[] | null) => response || [],
});
