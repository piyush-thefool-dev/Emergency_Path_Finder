import { CheckCircle2, MapPin } from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';

export function severityTone(sev) {
  if (sev === 'CRITICAL') return 'critical';
  if (sev === 'HIGH') return 'warning';
  return 'neutral';
}

export function statusTone(st) {
  if (st === 'OPEN') return 'critical';
  if (st === 'IN_PROGRESS' || st === 'DISPATCHED') return 'progress';
  if (st === 'RESOLVED') return 'resolved';
  return 'neutral';
}

export function IncidentDetailPanel({
  incident,
  assignableUnits,
  onAssignUnit,
  onUpdateStatus,
  onShowOnMap,
}) {
  if (!incident) return null;

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{incident.id}</span>
            <StatusBadge tone={severityTone(incident.severity)}>
              {incident.severity}
            </StatusBadge>
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">
            {incident.typeLabel}
          </h2>
        </div>
        <StatusBadge tone={statusTone(incident.status)} dot>
          {incident.status.replace('_', ' ')}
        </StatusBadge>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between gap-2">
          <span className="text-slate-500 dark:text-slate-400">Location</span>
          <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{incident.locationName}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-500 dark:text-slate-400">Coordinates</span>
          <span className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
            {incident.lat.toFixed(4)}, {incident.lon.toFixed(4)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-500 dark:text-slate-400">Data Origin</span>
          <span className="text-slate-500 dark:text-slate-400">
            {incident.isDemoScenario ? 'Sample Dispatch Scenario' : 'Operator Logged'}
          </span>
        </div>
      </div>

      {incident.notes && (
        <div className="p-3 rounded-lg bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/90 dark:border-white/[0.08] text-xs text-slate-900 dark:text-slate-100">
          {incident.notes}
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
        <label className="block text-xs font-medium text-slate-900 dark:text-slate-100">
          Assign / Switch Ambulance
        </label>
        <div className="flex gap-2">
          <select
            aria-label="Assign ambulance unit"
            value={incident.assignedUnitId || ''}
            onChange={(e) => {
              if (e.target.value) onAssignUnit(incident.id, e.target.value);
            }}
            className="flex-1 h-9 px-2.5 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-slate-100"
          >
            <option value="">Select ambulance unit…</option>
            {assignableUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.id} — {u.unitType} ({u.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => onShowOnMap(incident)}
          className="h-9 px-3 rounded-lg bg-[#D62828] hover:bg-red-700 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Show on Map</span>
        </button>

        {incident.status !== 'RESOLVED' ? (
          <button
            type="button"
            onClick={() => onUpdateStatus(incident.id, 'RESOLVED')}
            className="h-9 px-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark Resolved</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onUpdateStatus(incident.id, 'OPEN')}
            className="h-9 px-3 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium cursor-pointer"
          >
            Reopen Case
          </button>
        )}
      </div>
    </div>
  );
}

export default IncidentDetailPanel;
