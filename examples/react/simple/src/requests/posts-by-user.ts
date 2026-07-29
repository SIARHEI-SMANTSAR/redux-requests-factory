import { requestsFactory, type RequestContext } from 'redux-requests-factory';

interface Post {
  id: number;
  title: string;
}

interface Params {
  userId: number;
}

const loadUserPostsRequest = (
  { userId }: Params,
  { signal }: RequestContext
): Promise<Post[]> =>
  fetch(`https://jsonplaceholder.typicode.com/posts?userId=${userId}`, {
    signal,
  }).then((res) => res.json());

export const {
  loadDataAction: loadUserPostsAction,
  forcedLoadDataAction: forcedLoadUserPostsAction,
  responseSelector: userPostsSelector,
  setResponseAction: setUserPostsAction,
} = requestsFactory({
  request: loadUserPostsRequest,
  stateRequestKey: 'user-posts',
  useDebounce: true,
  serializeRequestParameters: ({ userId }: Params) => `${userId}`,
  transformResponse: (response: Post[] | undefined) => response || [],
});
