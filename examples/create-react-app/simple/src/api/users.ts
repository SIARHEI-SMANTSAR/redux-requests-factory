import { requestsFactory } from 'redux-requests-factory';

const loadUsersRequest = () =>
  fetch('https://jsonplaceholder.typicode.com/users');

export const { doRequestAction: loadUsersAction } = requestsFactory({
  request: loadUsersRequest,
});
