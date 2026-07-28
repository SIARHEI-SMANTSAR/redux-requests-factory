import { Suspense } from 'react';

import {
  ActivityFallback,
  ActivityList,
  CardFallback,
  ProjectsCard,
  SuccessRateCard,
  TeamMembersCard,
} from '../components/Dashboard';
import { ForceReloadButton } from '../components/ForceReloadButton';
import {
  reloadActivityAction,
  reloadStatsAction,
} from '../dashboard-requests';
import { reloadUsersAction } from '../users-request';

export function BatchRequestsPage() {
  return (
    <section>
      <p className="eyebrow">use(promise) · independent boundaries</p>
      <h1>Streamed dashboard</h1>
      <p className="intro">
        Every component owns its Redux request. Independent Suspense boundaries
        stream as their cached Promises resolve.
      </p>

      <div className="reload-actions" aria-label="Force reload requests">
        <ForceReloadButton action={reloadUsersAction}>
          Force reload users
        </ForceReloadButton>
        <ForceReloadButton action={reloadStatsAction}>
          Force reload stats
        </ForceReloadButton>
        <ForceReloadButton action={reloadActivityAction}>
          Force reload activity
        </ForceReloadButton>
      </div>

      <div className="dashboard">
        <Suspense fallback={<CardFallback label="Team members" />}>
          <TeamMembersCard />
        </Suspense>
        <Suspense fallback={<CardFallback label="Projects" />}>
          <ProjectsCard />
        </Suspense>
        <Suspense fallback={<CardFallback label="Success rate" />}>
          <SuccessRateCard />
        </Suspense>
      </div>

      <Suspense fallback={<ActivityFallback />}>
        <ActivityList />
      </Suspense>
    </section>
  );
}
