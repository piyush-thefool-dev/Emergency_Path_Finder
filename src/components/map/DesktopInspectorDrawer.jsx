import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Building2, Navigation, X } from 'lucide-react';
import IncidentTool from './IncidentTool.jsx';
import LiveLocationTracker from './LiveLocationTracker.jsx';
import { formatDuration } from '../../utils/time.js';

export function DesktopInspectorDrawer({
  onClose,
  graph,
  routing,
  live,
  canDragAmbulance,
  setCanDragAmbulance,
}) {
  const [activeTab, setActiveTab] = useState('alerts');
  const {
    weightedGraph, timeOfDay, weather,
    incidents, addIncident, removeIncident, clearIncidents, reporter, setReporter,
  } = graph;
  const {
    ambulancePos, snappedSourceNode, setSelectedHospitalId,
    activeHospital, availableHospitals, topHospitals,
  } = routing;

  return (
    <aside className="absolute top-16 right-4 bottom-24 w-[360px] z-[650] rounded-2xl border border-slate-200/90 dark:border-white/[0.1] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 font-mono">
          Corridor Inspector
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          aria-label="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/80 dark:bg-slate-950/60 p-1 gap-1">
        {[
          { id: 'alerts', label: 'Road Alerts', icon: AlertTriangle },
          { id: 'hospitals', label: 'Hospitals', icon: Building2 },
          { id: 'telemetry', label: 'Telemetry', icon: Navigation },
        ].map((t) => {
          const Icon = t.icon;
          const on = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                on
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-white/[0.08]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'alerts' && (
          <IncidentTool
            edges={weightedGraph.edges}
            nodes={weightedGraph.nodes}
            incidents={incidents}
            ambulancePos={ambulancePos}
            reporter={reporter}
            onChangeReporter={setReporter}
            onAddIncident={addIncident}
            onRemoveIncident={removeIncident}
            onClearIncidents={clearIncidents}
            timeOfDay={timeOfDay}
            weather={weather}
          />
        )}

        {activeTab === 'hospitals' && (
          <div className="space-y-2 text-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>In-Range Candidates ({topHospitals.length})</span>
              <Link to="/hospitals" className="text-[#D62828] no-underline hover:underline">
                All {availableHospitals.length} →
              </Link>
            </div>
            {topHospitals.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedHospitalId(h.id)}
                className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  h.id === activeHospital?.id
                    ? 'border-[#D62828] bg-red-500/10'
                    : 'border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {h.shortName || h.name}
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400 shrink-0">
                  {formatDuration(h.travelTimeSec || 0)}
                </span>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'telemetry' && (
          <LiveLocationTracker
            isGpsActive={live.isGpsActive}
            gpsAccuracy={live.gpsAccuracy}
            gpsSpeedKph={live.gpsSpeedKph}
            gpsHeading={live.gpsHeading}
            gpsError={live.gpsError}
            totalDistanceMovedM={live.totalDistanceMovedM}
            followVehicle={live.followVehicle}
            onToggleFollow={live.setFollowVehicle}
            onStartGps={live.startGps}
            onStopGps={live.stopGps}
            currentPos={ambulancePos}
            snappedNode={snappedSourceNode}
            canDragPin={canDragAmbulance}
            onTogglePinLock={setCanDragAmbulance}
          />
        )}
      </div>
    </aside>
  );
}

export default DesktopInspectorDrawer;
