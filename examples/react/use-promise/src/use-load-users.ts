import { use } from 'react';
import { RequestsStatuses } from 'redux-requests-factory';

import { useAppDispatch, useAppSelector } from './hooks';
import { loadUsersAction, usersStatusSelector } from './users-request';

export default function useLoadUsers() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(usersStatusSelector);

  if (
    status === RequestsStatuses.None ||
    status === RequestsStatuses.Loading
  ) {
    use(dispatch(loadUsersAction()));
  }
}
