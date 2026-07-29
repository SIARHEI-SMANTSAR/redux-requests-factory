import { requestsFactory, type RequestContext } from 'redux-requests-factory';

interface User {
  id: number;
  name: string;
}

const loadUsersRequest = (
  _params: undefined,
  { signal }: RequestContext
): Promise<User[]> =>
  fetch('https://jsonplaceholder.typicode.com/users', { signal }).then((res) =>
    res.json()
  );

export const {
  loadDataAction: loadUsersAction,
  forcedLoadDataAction: forcedLoadUsersAction,
  cancelRequestAction: cancelLoadUsersAction,
  requestFulfilledAction: loadUsersFulfilledAction,
  responseSelector: usersSelector,
} = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
  transformResponse: (response: User[] | undefined) => response || [],
});
