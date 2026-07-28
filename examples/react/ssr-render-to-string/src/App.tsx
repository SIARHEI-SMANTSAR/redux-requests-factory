import { NavLink, Route, Routes } from 'react-router';

import { BatchRequestsPage } from './pages/BatchRequestsPage';
import { SingleRequestPage } from './pages/SingleRequestPage';

export function App() {
  return (
    <main>
      <nav aria-label="Examples">
        <NavLink to="/single">Single request</NavLink>
        <NavLink to="/batch">Request batch</NavLink>
      </nav>

      <Routes>
        <Route path="/batch" element={<BatchRequestsPage />} />
        <Route path="*" element={<SingleRequestPage />} />
      </Routes>
    </main>
  );
}
