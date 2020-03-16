import { requestsFactory } from 'redux-requests-factory';
import fetch from 'isomorphic-unfetch';

const loadUsersRequest = () =>
  fetch('https://jsonplaceholder.typicode.com/users').then(res => res.json());

export const { loadDataAction: loadUsersAction } = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
});
