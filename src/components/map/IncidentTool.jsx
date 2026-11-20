/**
 * Road Incident & Congestion Tool: Live Dynamic Re-routing Injection.
 * Allows dispatchers and ambulance crews to report bottlenecks, crashes, or closures.
 */

import { useMemo, useState } from 'react';
import { Flame, X, RefreshCw, LocateFixed, CheckCircle2, ShieldAlert } from 'lucide-react';
import { TRAFFIC_LEVEL_LIST, REPORTERS } from '../../config/trafficLevels.js';
import { buildIncidentList, edgeDisplayName, findNearestEdge, timeAgo } from '../../utils/incidents.js';

export function IncidentTool({
  edges = [],
  nodes = [],
  incidents = new Map(),
  ambulancePos = null,
  reporter = REPORTERS[0],
  onChangeReporter,
  onAddIncident,
  onRemoveIncident,
  onClearIncidents,
}) {
  const [selectedEdgeId, setSelectedEdgeId] = useState('');
  const [levelId, setLevelId] = useState('heavy');
  const [notice, setNotice] = useState(null);

  const list = useMemo(() => buildIncidentList(incidents, edges, nodes), [incidents, edges, nodes]);
  const level = TRAFFIC_LEVEL_LIST.find((l) => l.id === levelId) || TRAFFIC_LEVEL_LIST[1];

  const handleApply = () => {
    if (!selectedEdgeId) return;
    onAddIncident(selectedEdgeId, levelId);
    setSelectedEdgeId('');
    setNotice(null);
  };

  const handleHere = () => {
    const hit = findNearestEdge(edges, nodes, ambulancePos);
    if (!hit) {
      setNotice('No mapped road within 400 m of the ambulance pin.');
      return;
    }
    onAddIncident(hit.edge.id, levelId);
    setNotice(`${level.label} reported on ${edgeDisplayName(hit.edge)}.`);
  };

  return (
    <div className="@container bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs p-4 sm:p-5 space-y-4 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
          <Flame className="w-4 h-4 text-[#D62828] shrink-0" />
          <span>Incident Injection & Dynamic Re-routing</span>
        </div>
        {list.length > 0 && (
          <button
            type="button"
            onClick={onClearIncidents}
            title="Remove every incident report and recalculate baseline paths"
            className="text-[11px] font-mono text-[#D62828] dark:text-red-400 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Clear All ({list.length})
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
        Simulate real-time road conditions. When an incident is logged, edge weight t(e) inflates, triggering immediate graph recalculation.
      </p>

      {onChangeReporter && (
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          {REPORTERS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChangeReporter(r)}
              title={r === 'Public' ? 'Logged as public citizen report' : 'Logged as authenticated ambulance telemetry'}
              aria-pressed={reporter === r}
              className={`py-1.5 rounded-md text-xs font-mono font-bold cursor-pointer transition-all ${
                reporter === r
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              {r === 'Public' ? 'Public Telemetry' : 'Ambulance Unit'}
            </button>
          ))}
        </div>
      )}

      {/* Level picker */}
      <div className="grid grid-cols-2 @xl:grid-cols-4 gap-2">
        {TRAFFIC_LEVEL_LIST.map((lvl) => {
          const on = lvl.id === levelId;
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => setLevelId(lvl.id)}
              title={lvl.hint}
              aria-pressed={on}
              className={`p-2 rounded-lg border text-xs font-mono font-bold cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 min-h-[40px] ${
                on
                  ? 'text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
              style={on ? { backgroundColor: lvl.color, borderColor: lvl.color } : undefined}
            >
              {!on && (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: lvl.color }} />
              )}
              {lvl.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 @3xl:grid-cols-[minmax(0,1fr)_auto] gap-2">
        <select
          value={selectedEdgeId}
          onChange={(e) => setSelectedEdgeId(e.target.value)}
          aria-label="Select a road segment"
          className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-red-500 transition-colors truncate"
        >
          <option value="">Select road segment to obstruct…</option>
          {edges.map((edge) => (
            <option key={edge.id} value={edge.id}>
              {edge.name || 'Unnamed segment'} · {String(edge.roadType || 'road').replace(/_/g, ' ')} · {edge.lengthM} m
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleApply}
          title="Apply the chosen congestion level"
          disabled={!selectedEdgeId}
          className="px-4 py-2 text-white rounded-lg text-xs font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
          style={{ backgroundColor: level.color }}
        >
          Log {level.short}
        </button>
      </div>

      {ambulancePos && (
        <button
          type="button"
          onClick={handleHere}
          title="Mark the road nearest to the ambulance pin with the chosen congestion level"
          className="w-full py-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <LocateFixed className="w-3.5 h-3.5 text-[#D62828]" />
          Inject at Current Ambulance Coordinate
        </button>
      )}

      {notice && (
        <p role="status" className="text-xs font-mono rounded-lg px-3 py-2 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-px" />
          <span>{notice}</span>
        </p>
      )}

      {/* Active Incident Roster */}
      {list.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
            Active Blockages ({list.length})
          </span>
          <ul className="space-y-1.5">
            {list.map((item) => (
              <li
                key={item.edgeId}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 p-2"
              >
                <span
                  className="w-5 h-5 rounded-full shrink-0 text-white text-[10px] font-black font-mono flex items-center justify-center"
                  style={{ backgroundColor: item.level.color }}
                >
                  {item.level.symbol}
                </span>
                <span className="min-w-0 flex-1 font-mono">
                  <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {item.name}
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    <span className="font-bold" style={{ color: item.level.color }}>
                      {item.level.label}
                    </span>
                    {' · '}{item.reportedBy}{' · '}{timeAgo(item.timestamp)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveIncident(item.edgeId)}
                  aria-label={`Mark ${item.name} as clear`}
                  title="Remove blockage"
                  className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default IncidentTool;
