/**
 * Desktop Shell (>= 1024px):
 * Enterprise Left Collapsible Sidebar + Top Command Bar + Current Glassmorphic Canvas.
 * Routes dispatch pages (Live Map, Emergency Incidents, Ambulance Fleet,
 * Hospitals, Route Optimization, Analytics & Reports, Settings) + engineering pages.
 */

import { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import DesktopSidebar from './DesktopSidebar.jsx';
import DesktopTopBar from './DesktopTopBar.jsx';
import HospitalBedManagerModal from '../panels/HospitalBedManagerModal.jsx';
import MapScreen from '../map/MapScreen.jsx';
import Incidents from '../../pages/Incidents.jsx';
import AmbulanceFleet from '../../pages/AmbulanceFleet.jsx';
import Hospitals from '../../pages/Hospitals.jsx';
import RouteOptimization from '../../pages/RouteOptimization.jsx';
import Analytics from '../../pages/Analytics.jsx';
import Settings from '../../pages/Settings.jsx';
import BedsPage from '../../pages/BedsPage.jsx';
import ControlsPage from '../../pages/ControlsPage.jsx';
import Benchmark from '../../pages/Benchmark.jsx';
import Evaluation from '../../pages/Evaluation.jsx';
import GraphExplorer from '../../pages/GraphExplorer.jsx';
import Architecture from '../../pages/Architecture.jsx';
import { useDispatch } from '../../context/DispatchContext.jsx';
import { useBedManager } from '../../context/BedManagerContext.jsx';
import { EMERGENCY_CATEGORIES } from '../../config/emergencyCategories.js';

export function DesktopShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isFullBleedMap = pathname === '/' || pathname === '/map';
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newType, setNewType] = useState('TRAUMA');
  const [newSeverity, setNewSeverity] = useState('CRITICAL');
  const [newNotes, setNewNotes] = useState('');

  const { routing, createIncident } = useDispatch();
  const { isBedManagerOpen, closeBedManager } = useBedManager();

  const handleQuickCreate = (e) => {
    e.preventDefault();
    createIncident({
      locationName: newLocName.trim() || 'Active Dispatch Sector',
      type: newType,
      typeLabel: EMERGENCY_CATEGORIES[newType]?.label || newType,
      severity: newSeverity,
      notes: newNotes.trim(),
      assignedUnitId: 'AMB-01',
    });
    setNewLocName('');
    setNewNotes('');
    setQuickModalOpen(false);
    navigate('/map');
  };

  return (
    <div className="min-h-dvh h-dvh w-full flex overflow-hidden bg-[#F8FAFC] dark:bg-[#080C16] ambient-glow-light dark:ambient-glow-dark text-slate-900 dark:text-slate-100 selection:bg-[#D62828] selection:text-white transition-colors duration-200">
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {!isFullBleedMap && (
          <DesktopTopBar onQuickReportEmergency={() => setQuickModalOpen(true)} />
        )}

        <main className={isFullBleedMap ? 'flex-1 min-h-0 overflow-hidden relative' : 'flex-1 min-h-0 overflow-y-auto px-6 py-5'}>
          <div className={isFullBleedMap ? 'h-full w-full' : 'max-w-[1440px] mx-auto'}>
            <Routes>
              <Route path="/" element={<MapScreen variant="desktop" fullBleed onOpenNewEmergency={() => setQuickModalOpen(true)} />} />
              <Route path="/map" element={<MapScreen variant="desktop" fullBleed onOpenNewEmergency={() => setQuickModalOpen(true)} />} />
              <Route path="/incidents" element={<Incidents onOpenNewEmergency={() => setQuickModalOpen(true)} />} />
              <Route path="/fleet" element={<AmbulanceFleet />} />
              <Route path="/hospitals" element={<Hospitals />} />
              <Route path="/routing" element={<RouteOptimization />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/beds" element={<BedsPage />} />
              <Route path="/controls" element={<ControlsPage />} />
              <Route path="/benchmark" element={<Benchmark />} />
              <Route path="/evaluation" element={<Evaluation />} />
              <Route path="/graph-explorer" element={<GraphExplorer />} />
              <Route path="/architecture" element={<Architecture />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      <HospitalBedManagerModal
        isOpen={isBedManagerOpen}
        onClose={closeBedManager}
        hospitals={routing.availableHospitals}
        onSaveHospitals={routing.saveCustomHospitals}
        onResetToDefaults={routing.resetCustomHospitals}
      />

      {/* Quick Report Emergency Modal */}
      {quickModalOpen && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.1] shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Log Emergency Incident</h2>
              <button
                type="button"
                onClick={() => setQuickModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleQuickCreate} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Pickup Location / Sector
                </label>
                <input
                  type="text"
                  required
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="e.g. Pari Chowk Sector Alpha Crossing"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 focus:border-[#D62828] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Emergency Category
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100"
                  >
                    {Object.values(EMERGENCY_CATEGORIES).map((c) => (
                      <option key={c.id} value={c.id}>{c.shortLabel}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Severity
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MODERATE">Moderate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Dispatch Notes
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Optional patient triage or access notes…"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 focus:border-[#D62828] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setQuickModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-[#D62828] hover:bg-red-700 text-white font-semibold cursor-pointer"
                >
                  Dispatch AMB-01
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DesktopShell;
