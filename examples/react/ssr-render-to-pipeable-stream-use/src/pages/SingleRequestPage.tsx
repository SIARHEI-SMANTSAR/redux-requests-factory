import { Suspense } from 'react';

import { UsersFallback, UsersList } from '../components/UsersList';

export function SingleRequestPage() {
  return (
    <section>
      <p className="eyebrow">use(promise) · one boundary</p>
      <h1>Single streamed request</h1>
      <p className="intro">
        The page shell streams immediately. UsersList reads its cached Redux
        request Promise with use and streams later from its Suspense boundary.
      </p>

      <Suspense fallback={<UsersFallback />}>
        <UsersList />
      </Suspense>
    </section>
  );
}
