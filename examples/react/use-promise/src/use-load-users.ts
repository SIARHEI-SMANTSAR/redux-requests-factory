import { use } from 'react';

import { useAppDispatch, useAppSelector } from './hooks';
import {
  loadUsersAction,
  usersRequestVersionSelector,
} from './users-request';

export default function useLoadUsers() {
  const dispatch = useAppDispatch();
  // A new request version means loadDataAction now returns a replacement
  // Promise. Subscribe so this render reads it through use().
  useAppSelector(usersRequestVersionSelector);

  use(dispatch(loadUsersAction()));
}
