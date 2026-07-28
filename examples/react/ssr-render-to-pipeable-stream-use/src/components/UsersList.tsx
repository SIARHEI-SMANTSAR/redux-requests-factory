import { useSelector } from 'react-redux';

import { useUsersRequest } from '../hooks/use-request';
import { usersSelector } from '../users-request';

export function UsersList() {
  useUsersRequest();
  const users = useSelector(usersSelector);

  return (
    <ul className="users">
      {users.map((user) => (
        <li key={user.id}>
          <strong>{user.name}</strong>
          <span>{user.role}</span>
        </li>
      ))}
    </ul>
  );
}

export function UsersFallback() {
  return <p className="stream-fallback">Streaming users…</p>;
}
