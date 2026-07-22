import { requestsFactory } from 'redux-requests-factory';

import { getUsers, type User } from '@/lib/users-data';

export type { User };

const loadUsersRequest = async (): Promise<User[]> => {
  if (typeof window === 'undefined') {
    return getUsers();
  }

  const response = await fetch('/api/users');

  if (!response.ok) {
    throw new Error('Failed to load users');
  }

  return response.json() as Promise<User[]>;
};

export const {
  errorSelector: usersErrorSelector,
  forcedLoadDataAction: forceReloadUsersAction,
  isLoadingSelector: usersLoadingSelector,
  loadDataAction: loadUsersAction,
  responseSelector: usersSelector,
} = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
});
