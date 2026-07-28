import { useSelector } from 'react-redux';

import {
  activitySelector,
  statsSelector,
} from '../dashboard-requests';
import {
  useActivityRequest,
  useStatsRequest,
  useUsersRequest,
} from '../hooks/use-request';
import { usersSelector } from '../users-request';

export function TeamMembersCard() {
  useUsersRequest();
  const users = useSelector(usersSelector);

  return (
    <article>
      <span>Team members</span>
      <strong>{users.length}</strong>
    </article>
  );
}

export function ProjectsCard() {
  useStatsRequest();
  const stats = useSelector(statsSelector);

  return (
    <article>
      <span>Projects</span>
      <strong>{stats?.projects}</strong>
    </article>
  );
}

export function SuccessRateCard() {
  // The store's middleware deduplicates this with ProjectsCard.
  useStatsRequest();
  const stats = useSelector(statsSelector);

  return (
    <article>
      <span>Success rate</span>
      <strong>{stats?.successRate}</strong>
    </article>
  );
}

export function ActivityList() {
  useActivityRequest();
  const activity = useSelector(activitySelector);

  return (
    <>
      <h2>Latest activity</h2>
      <ul className="activity">
        {activity.map((item) => (
          <li key={item.id}>{item.message}</li>
        ))}
      </ul>
    </>
  );
}

export function CardFallback({ label }: { label: string }) {
  return (
    <article className="stream-fallback" aria-busy="true">
      <span>{label}</span>
      <strong>…</strong>
    </article>
  );
}

export function ActivityFallback() {
  return <p className="stream-fallback">Streaming activity…</p>;
}
