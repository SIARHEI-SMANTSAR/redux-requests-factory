import { requestsFactory } from 'redux-requests-factory';

export type User = {
  id: number;
  name: string;
  role: string;
};

type LoadUsersParams = {
  baseUrl?: string;
};

const loadUsersRequest = async ({
  baseUrl = '',
}: LoadUsersParams = {}): Promise<User[]> => {
  const response = await fetch(`${baseUrl}/api/users`);

  if (!response.ok) {
    throw new Error(`Users request failed with status ${response.status}`);
  }

  return response.json() as Promise<User[]>;
};

export const {
  forcedLoadDataAction: reloadUsersAction,
  loadDataAction: loadUsersAction,
  requestStatusSelector: usersStatusSelector,
  responseSelector: usersSelector,
} = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
  transformResponse: (response: User[] | undefined) => response ?? [],
});
