import { requestsFactory } from 'redux-requests-factory';

export type User = {
  id: number;
  name: string;
  role: string;
  location: string;
};

const wait = (duration: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration);
  });

const loadUsersRequest = async (): Promise<User[]> => {
  await wait(900);

  const response = await fetch(`${import.meta.env.BASE_URL}users.json`);

  if (!response.ok) {
    throw new Error(`Users request failed with status ${response.status}`);
  }

  return response.json() as Promise<User[]>;
};

export const {
  errorSelector: usersErrorSelector,
  forcedLoadDataAction: forceLoadUsersAction,
  loadDataAction: loadUsersAction,
  requestStatusSelector: usersStatusSelector,
  responseSelector: usersSelector,
} = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
});
