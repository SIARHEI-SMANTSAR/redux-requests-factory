import { requestsFactory, type RequestContext } from 'redux-requests-factory';

import type { RootState } from './store';

export type User = {
  id: number;
  name: string;
  role: string;
  location: string;
};

const wait = (duration: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, duration);
    const abort = () => {
      window.clearTimeout(timeout);
      reject(signal?.reason ?? new Error('Request aborted'));
    };

    if (signal?.aborted) {
      abort();
    } else {
      signal?.addEventListener('abort', abort, { once: true });
    }
  });

const loadUsersRequest = async (
  _params: undefined,
  { signal }: RequestContext
): Promise<User[]> => {
  await wait(900, signal);

  const response = await fetch(`${import.meta.env.BASE_URL}users.json`, {
    signal,
  });

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
} = requestsFactory<User[], unknown, undefined, RootState>({
  request: loadUsersRequest,
  stateRequestKey: 'users',
});
