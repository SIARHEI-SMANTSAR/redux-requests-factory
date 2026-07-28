import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch } from '../store';
import {
  loadUsersAction,
  reloadUsersAction,
  usersSelector,
} from '../users-request';

export function SingleRequestPage() {
  const users = useSelector(usersSelector);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // After SSR hydration this is a cache hit. After client-side navigation it
    // loads only when the request has not been loaded on another page yet.
    void dispatch(loadUsersAction());
  }, [dispatch]);

  return (
    <section>
      <p className="eyebrow">One awaited action</p>
      <h1>Single request</h1>
      <p className="intro">
        The server awaits one users request before rendering this route.
      </p>

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
    </section>
  );
}
