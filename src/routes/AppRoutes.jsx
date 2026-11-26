/**
 * Mobile / App Application routes.
 *
 * "/" and "/map" show the persistent full-screen 3D MapScreen mounted by AppShell.
 * Navigation drawer covers Incidents, Fleet, Hospitals, Beds, Controls, Optimization, Analytics, and Settings.
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HospitalsPage from '../pages/HospitalsPage.jsx';
import BedsPage from '../pages/BedsPage.jsx';
import ControlsPage from '../pages/ControlsPage.jsx';
import MorePage from '../pages/MorePage.jsx';
import Incidents from '../pages/Incidents.jsx';
import AmbulanceFleet from '../pages/AmbulanceFleet.jsx';
import Hospitals from '../pages/Hospitals.jsx';
import RouteOptimization from '../pages/RouteOptimization.jsx';
import Analytics from '../pages/Analytics.jsx';
import Settings from '../pages/Settings.jsx';
import Benchmark from '../pages/Benchmark.jsx';
import Evaluation from '../pages/Evaluation.jsx';
import GraphExplorer from '../pages/GraphExplorer.jsx';
import Architecture from '../pages/Architecture.jsx';
import MobilePageHeader from '../components/layout/MobilePageHeader.jsx';

function SubPage({ title, subtitle, children }) {
  return (
    <div className="page-shell">
      <MobilePageHeader title={title} subtitle={subtitle} backTo="/" />
      <div className="px-3.5 pt-3.5 pb-6 [&_.dispatch-section-header]:hidden">{children}</div>
    </div>
  );
}

export function AppRoutes() {
  const location = useLocation();
  return (
    <Routes location={location}>
      <Route path="/" element={null} />
      <Route path="/map" element={null} />
      <Route path="/hospitals" element={<HospitalsPage />} />
      <Route path="/beds" element={<BedsPage />} />
      <Route path="/controls" element={<ControlsPage />} />
      <Route path="/more" element={<MorePage />} />
      <Route path="/incidents" element={<SubPage title="Emergency Incidents" subtitle="Queue, ambulance dispatch & road alerts"><Incidents /></SubPage>} />
      <Route path="/fleet" element={<SubPage title="Ambulance Fleet" subtitle="Live GPS telemetry & unit readiness"><AmbulanceFleet /></SubPage>} />
      <Route path="/directory" element={<SubPage title="Hospitals" subtitle="State-wise 360 referral hospitals, ETA & beds"><Hospitals /></SubPage>} />
      <Route path="/routing" element={<SubPage title="Route Optimization" subtitle="Dijkstra vs A* & live road probe"><RouteOptimization /></SubPage>} />
      <Route path="/analytics" element={<SubPage title="Analytics & Reports" subtitle="Algorithm pruning & ICU capacity"><Analytics /></SubPage>} />
      <Route path="/settings" element={<SubPage title="Settings" subtitle="Road graph topology & licensing"><Settings /></SubPage>} />
      <Route path="/benchmark" element={<SubPage title="Benchmark"><Benchmark /></SubPage>} />
      <Route path="/evaluation" element={<SubPage title="Models"><Evaluation /></SubPage>} />
      <Route path="/graph-explorer" element={<SubPage title="Graph Explorer"><GraphExplorer /></SubPage>} />
      <Route path="/architecture" element={<SubPage title="Architecture"><Architecture /></SubPage>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
