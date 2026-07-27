import { useAppSelector } from './hooks';
import useLoadUsers from './use-load-users';
import { usersErrorSelector, usersSelector } from './users-request';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'The users request failed.';

export default function UsersResult() {
  useLoadUsers();

  const users = useAppSelector(usersSelector) ?? [];
  const error = useAppSelector(usersErrorSelector);

  if (error) {
    return (
      <div className="error-card" role="alert">
        <span className="eyebrow">Request failed</span>
        <strong>{getErrorMessage(error)}</strong>
        <p>Start another request to retry.</p>
      </div>
    );
  }

  return (
    <div className="users-grid">
      {users.map((user, index) => (
        <article className="user-card" key={user.id}>
          <span className="user-number">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div>
            <h2>{user.name}</h2>
            <p>{user.role}</p>
          </div>
          <span className="location">{user.location}</span>
        </article>
      ))}
    </div>
  );
}
