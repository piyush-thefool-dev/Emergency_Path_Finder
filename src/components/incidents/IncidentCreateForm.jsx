import { useState } from 'react';
import { EMERGENCY_CATEGORIES } from '../../config/emergencyCategories.js';

export function IncidentCreateForm({ onCreate, onDone }) {
  const [locName, setLocName] = useState('');
  const [type, setType] = useState('TRAUMA');
  const [severity, setSeverity] = useState('CRITICAL');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      locationName: locName.trim() || 'Active Dispatch Sector',
      type,
      typeLabel: EMERGENCY_CATEGORIES[type]?.label || type,
      severity,
      assignedUnitId: 'AMB-01',
      focusMap: false,
    });
    setLocName('');
    onDone?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-[#D62828]/40 p-4 space-y-3 text-xs"
    >
      <div className="font-bold text-slate-900 dark:text-slate-100">Log Emergency Incident</div>
      <input
        type="text"
        required
        value={locName}
        onChange={(e) => setLocName(e.target.value)}
        placeholder="Pickup Location / Sector (e.g. Pari Chowk)"
        className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          aria-label="New incident category"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100"
        >
          {Object.values(EMERGENCY_CATEGORIES).map((c) => (
            <option key={c.id} value={c.id}>{c.shortLabel}</option>
          ))}
        </select>
        <select
          aria-label="New incident severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100"
        >
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High Priority</option>
          <option value="MODERATE">Moderate</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full h-9 rounded-xl bg-[#D62828] hover:bg-red-700 text-white font-semibold cursor-pointer"
      >
        Log &amp; Dispatch AMB-01
      </button>
    </form>
  );
}

export default IncidentCreateForm;
