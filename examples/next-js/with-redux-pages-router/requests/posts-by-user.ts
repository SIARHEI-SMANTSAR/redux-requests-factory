import { requestsFactory } from "redux-requests-factory";

export interface Post {
  id: number;
  title: string;
}

export interface UserPostsParams {
  userId: number;
}

const loadUserPostsRequest = ({
  userId,
}: UserPostsParams): Promise<Post[]> =>
  fetch(`https://jsonplaceholder.typicode.com/posts?userId=${userId}`).then(
    (res) => res.json()
  );

export const {
  loadDataAction: loadUserPostsAction,
  forcedLoadDataAction: forcedLoadUserPostsAction,
  responseSelector: userPostsSelector,
  setResponseAction: setUserPostsAction,
} = requestsFactory({
  request: loadUserPostsRequest,
  stateRequestKey: "user-posts",
  serializeRequestParameters: ({ userId }: UserPostsParams) => `${userId}`,
  transformResponse: (response: Post[] | undefined) => response || [],
});
