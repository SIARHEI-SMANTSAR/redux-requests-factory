import { useDispatch, useSelector } from 'react-redux';

import { useLoadUsers } from '../hooks/use-load-request';
import type { AppDispatch } from '../store';
import { reloadUsersAction, usersSelector } from '../users-request';

export function UsersList() {
  useLoadUsers();

  const users = useSelector(usersSelector);
  const dispatch = useDispatch<AppDispatch>();

  return (
    <>
      <ul className="users">
        {users.map((user) => (
          <li key={user.id}>
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </li>
        ))}
      </ul>

      <button onClick={() => void dispatch(reloadUsersAction())}>
        Reload users on the client
      </button>
    </>
  );
}
