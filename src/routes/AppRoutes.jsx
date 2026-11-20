/**
 * Application routes.
 *
 * "/" is the map, which AppShell keeps mounted permanently — so its route
 * renders nothing here. Every other route is a full page shown over the map.
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HospitalsPage from '../pages/HospitalsPage.jsx';
import BedsPage from '../pages/BedsPage.jsx';
import ControlsPage from '../pages/ControlsPage.jsx';
import MorePage from '../pages/MorePage.jsx';
import Benchmark from '../pages/Benchmark.jsx';
import Evaluation from '../pages/Evaluation.jsx';
import GraphExplorer from '../pages/GraphExplorer.jsx';
import Architecture from '../pages/Architecture.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';

/** Wraps the older, content-heavy pages with an app bar + back-to-More. */
function SubPage({ title, children }) {
  return (
    <div className="page-shell">
      <PageHeader title={title} backTo="/more" />
      <div className="px-3.5 pt-3.5 pb-6">{children}</div>
    </div>
  );
}

export function AppRoutes() {
  const location = useLocation();
  return (
    <Routes location={location}>
      <Route path="/" element={null} />
      <Route path="/hospitals" element={<HospitalsPage />} />
      <Route path="/beds" element={<BedsPage />} />
      <Route path="/controls" element={<ControlsPage />} />
      <Route path="/more" element={<MorePage />} />
      <Route path="/benchmark" element={<SubPage title="Benchmark"><Benchmark /></SubPage>} />
      <Route path="/evaluation" element={<SubPage title="Models"><Evaluation /></SubPage>} />
      <Route path="/graph-explorer" element={<SubPage title="Graph Explorer"><GraphExplorer /></SubPage>} />
      <Route path="/architecture" element={<SubPage title="Architecture"><Architecture /></SubPage>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
