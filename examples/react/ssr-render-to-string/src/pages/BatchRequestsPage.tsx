import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  activitySelector,
  loadActivityAction,
  loadStatsAction,
  statsSelector,
} from '../dashboard-requests';
import type { AppDispatch } from '../store';
import { loadUsersAction, usersSelector } from '../users-request';

export function BatchRequestsPage() {
  const users = useSelector(usersSelector);
  const stats = useSelector(statsSelector);
  const activity = useSelector(activitySelector);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // These are cache hits after SSR, or parallel client requests when this
    // page is reached through React navigation from /single.
    void dispatch(loadUsersAction());
    void dispatch(loadStatsAction());
    void dispatch(loadActivityAction());
  }, [dispatch]);

  return (
    <section>
      <p className="eyebrow">Three parallel actions</p>
      <h1>Request batch</h1>
      <p className="intro">
        On a page reload the server starts all requests together and waits for
        the middleware’s aggregate promise before rendering.
      </p>

      <div className="dashboard">
        <article>
          <span>Team members</span>
          <strong>{users.length}</strong>
        </article>
        <article>
          <span>Projects</span>
          <strong>{stats?.projects ?? '…'}</strong>
        </article>
        <article>
          <span>Success rate</span>
          <strong>{stats?.successRate ?? '…'}</strong>
        </article>
      </div>

      <h2>Latest activity</h2>
      <ul className="activity">
        {activity.map((item) => (
          <li key={item.id}>{item.message}</li>
        ))}
      </ul>
    </section>
  );
}
