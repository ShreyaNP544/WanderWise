import { Route, Routes } from 'react-router';
import { AppShell } from './components/layout/AppShell.jsx';
import Landing from './pages/Landing.jsx';
import PlanTrip from './pages/PlanTrip.jsx';
import Trip from './pages/Trip.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Landing />} />
        <Route path="plan" element={<PlanTrip />} />
        <Route path="trip/:id" element={<Trip />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
