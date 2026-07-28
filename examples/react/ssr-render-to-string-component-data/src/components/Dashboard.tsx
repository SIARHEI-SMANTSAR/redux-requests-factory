import { useSelector } from 'react-redux';

import {
  activitySelector,
  statsSelector,
} from '../dashboard-requests';
import {
  useLoadActivity,
  useLoadStats,
  useLoadUsers,
} from '../hooks/use-load-request';
import { usersSelector } from '../users-request';

function TeamMembersCard() {
  useLoadUsers();
  const users = useSelector(usersSelector);

  return (
    <article>
      <span>Team members</span>
      <strong>{users.length}</strong>
    </article>
  );
}

function ProjectsCard() {
  useLoadStats();
  const stats = useSelector(statsSelector);

  return (
    <article>
      <span>Projects</span>
      <strong>{stats?.projects ?? '…'}</strong>
    </article>
  );
}

function SuccessRateCard() {
  // This intentionally loads the same request as ProjectsCard. The factory
  // deduplicates both components' actions into one request.
  useLoadStats();
  const stats = useSelector(statsSelector);

  return (
    <article>
      <span>Success rate</span>
      <strong>{stats?.successRate ?? '…'}</strong>
    </article>
  );
}

function ActivityList() {
  useLoadActivity();
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

export function Dashboard() {
  return (
    <>
      <div className="dashboard">
        <TeamMembersCard />
        <ProjectsCard />
        <SuccessRateCard />
      </div>
      <ActivityList />
    </>
  );
}
