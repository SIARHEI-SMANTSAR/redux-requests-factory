import { requestsFactory, type RequestContext } from 'redux-requests-factory';

export type User = {
  id: number;
  name: string;
  role: string;
};

type LoadUsersParams = {
  baseUrl?: string;
};

class UsersRequestError extends Error {
  constructor(public readonly status: number) {
    super(`Users request failed with status ${status}`);
    this.name = 'UsersRequestError';
  }
}

const loadUsersRequest = async (
  { baseUrl = '' }: LoadUsersParams = {},
  { signal }: RequestContext
): Promise<User[]> => {
  const response = await fetch(`${baseUrl}/api/users`, { signal });

  if (!response.ok) {
    throw new UsersRequestError(response.status);
  }

  return response.json() as Promise<User[]>;
};

export const {
  forcedLoadDataAction: reloadUsersAction,
  loadDataAction: loadUsersAction,
  requestVersionSelector: usersRequestVersionSelector,
  responseSelector: usersSelector,
} = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
  retry: {
    maxRetries: 2,
    shouldRetry: ({ error }) =>
      error instanceof UsersRequestError &&
      (error.status === 429 || error.status >= 500),
    delay: ({ attempt }) => Math.min(250 * 2 ** (attempt - 1), 2_000),
  },
  transformResponse: (response: User[] | undefined) => response ?? [],
});
