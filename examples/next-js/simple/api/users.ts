import { requestsFactory } from 'redux-requests-factory';
import fetch from 'isomorphic-unfetch';

interface User {
  id: number;
  name: string;
}

const loadUsersRequest = (): Promise<User[]> =>
  fetch('https://jsonplaceholder.typicode.com/users').then(res => res.json());

export const {
  loadDataAction: loadUsersAction,
  responseSelector: usersSelector,
} = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
});
