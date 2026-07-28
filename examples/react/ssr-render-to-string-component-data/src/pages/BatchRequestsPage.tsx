import { Dashboard } from '../components/Dashboard';

export function BatchRequestsPage() {
  return (
    <section>
      <p className="eyebrow">Three parallel actions</p>
      <h1>Request batch</h1>
      <p className="intro">
        Each dashboard component owns its request. The discovery render starts
        them together and the second render returns all resolved data.
      </p>
      <Dashboard />
    </section>
  );
}
