import { Suspense } from 'react';

import { useAppDispatch } from './hooks';
import { forceLoadUsersAction } from './users-request';
import UsersResult from './users-result';

export default function App() {
  const dispatch = useAppDispatch();

  return (
    <main>
      <header className="hero">
        <div>
          <span className="eyebrow">React 19 · client-only SPA</span>
          <h1>
            Read Redux requests
            <br />
            with <code>use(promise)</code>
          </h1>
        </div>
        <p className="hero-copy">
          A custom hook starts the request and reads its stable cached Promise
          inside a Suspense boundary. Data and errors stay in Redux.
        </p>
      </header>

      <section className="demo-shell">
        <div className="toolbar">
          <div className="actions">
            <button
              className="secondary"
              onClick={() => dispatch(forceLoadUsersAction())}
              type="button"
            >
              Force reload
            </button>
          </div>
        </div>

        <div className="result">
          <Suspense fallback={<UsersSkeleton />}>
            <UsersResult />
          </Suspense>
        </div>
      </section>

      <footer>
        <code>useLoadUsers() + useAppSelector(...)</code>
        <span>redux-requests-factory × React Suspense</span>
      </footer>
    </main>
  );
}

function UsersSkeleton() {
  return (
    <div className="users-grid" aria-busy="true" aria-label="Loading users">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="user-card skeleton" key={index}>
          <span />
          <div>
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  );
}
