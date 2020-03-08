import { requestsFactory } from 'redux-requests-factory';

const loadUsersRequest = () =>
  fetch('https://jsonplaceholder.typicode.com/users').then(res => res.json());

export const { doRequestAction: loadUsersAction } = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
});
