import { UsersList } from '../components/UsersList';

export function SingleRequestPage() {
  return (
    <section>
      <p className="eyebrow">One awaited action</p>
      <h1>Single request</h1>
      <p className="intro">
        UsersList owns its request. The server discovers it during the first
        render and includes its data in the second render.
      </p>
      <UsersList />
    </section>
  );
}
