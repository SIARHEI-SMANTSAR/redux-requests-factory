import { requestsFactory } from 'redux-requests-factory';

interface Post {
  id: number;
  title: string;
}

interface Params {
  userId: number;
  title?: string;
  body?: string;
}

const addPostRequest = ({ userId, title, body }: Params): Promise<Post> =>
  fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    body: JSON.stringify({
      title,
      body,
      userId,
    }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  }).then(response => response.json());

export const {
  doRequestAction: addPostAction,
  cancelRequestAction: cancelAddPostAction,
  requestFulfilledAction: addPostFulfilledAction,
  requestRejectedAction: addPostRejectedAction,
  isLoadingSelector: isLoadingAddPostSelector,
  errorSelector: addPostErrorSelector,
} = requestsFactory({
  request: addPostRequest,
  stateRequestKey: 'add-post',
  includeInGlobalLoading: false,
  serializeRequestParameters: ({ userId }: Params) => `${userId}`,
  transformError: (error?: Error) => error && `Error: ${error.message}`,
});
