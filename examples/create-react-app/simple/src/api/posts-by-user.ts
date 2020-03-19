import {
  requestsFactory,
  RequestFactoryConfigWithSerialize,
} from 'redux-requests-factory';

import { RootState } from '../types';

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
  responseSelector: UserPostsSelector,
} = requestsFactory<
  Post[],
  null,
  Params,
  RootState,
  RequestFactoryConfigWithSerialize<Post[], Params>
>({
  request: loadUserPostsRequest,
  stateRequestKey: 'user-posts',
  serializeRequestParameters: ({ userId }: Params) => `${userId}`,
});
