/**
 * 21st.dev style Road Incident & Congestion Tool: Live Dynamic Re-routing Injection.
 * Allows dispatchers and ambulance crews to report bottlenecks, crashes, or closures.
 */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Flame, X, RefreshCw, LocateFixed, CheckCircle2, ShieldAlert } from 'lucide-react';
import { TRAFFIC_LEVEL_LIST, REPORTERS } from '../../config/trafficLevels.js';
import { buildIncidentList, edgeDisplayName, findNearestEdge, timeAgo } from '../../utils/incidents.js';
import Badge from '../ui/Badge.jsx';

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
  timeOfDay,
  weather,
  className = '',
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
    <div className={`@container rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] p-4 sm:p-5 space-y-4 transition-colors ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 text-[#D62828] dark:text-red-400 border border-red-500/20 flex items-center justify-center shrink-0 shadow-xs">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
              Road Congestion & Incident Tool
            </h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
              Inject Bottlenecks, Delays & Dynamic Re-routing
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {timeOfDay && (
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold">
              Active: {timeOfDay.replace('_', ' ').toUpperCase()}
            </span>
          )}
          {list.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onClearIncidents}
              title="Remove every incident report and recalculate baseline paths"
              className="text-[11px] font-mono text-[#D62828] dark:text-red-400 hover:text-red-700 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/10 cursor-pointer transition-colors shadow-xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Clear All ({list.length})</span>
            </motion.button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
        Report real-time road conditions. When an incident is logged, edge weight t(e) inflates, triggering immediate dynamic corridor recalculation.
      </p>

      {onChangeReporter && (
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-white/[0.08]">
          {REPORTERS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChangeReporter(r)}
              title={r === 'Public' ? 'Logged as public citizen report' : 'Logged as authenticated ambulance telemetry'}
              aria-pressed={reporter === r}
              className={`py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                reporter === r
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
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
            <motion.button
              key={lvl.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setLevelId(lvl.id)}
              title={lvl.hint}
              aria-pressed={on}
              className={`p-2.5 rounded-xl border text-xs font-mono font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 min-h-[42px] ${
                on
                  ? 'text-white shadow-sm'
                  : 'bg-slate-50/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.06] hover:border-slate-300'
              }`}
              style={on ? { backgroundColor: lvl.color, borderColor: lvl.color } : undefined}
            >
              {!on && (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: lvl.color }} />
              )}
              {lvl.label}
            </motion.button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 @3xl:grid-cols-[minmax(0,1fr)_auto] gap-2">
        <select
          value={selectedEdgeId}
          onChange={(e) => setSelectedEdgeId(e.target.value)}
          aria-label="Select a road segment"
          className="w-full text-xs font-mono bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-red-500 transition-colors truncate"
        >
          <option value="">Select road segment to obstruct…</option>
          {edges.map((edge) => (
            <option key={edge.id} value={edge.id}>
              {edge.name || 'Unnamed segment'} · {String(edge.roadType || 'road').replace(/_/g, ' ')} · {edge.lengthM} m
            </option>
          ))}
        </select>
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={handleApply}
          title="Apply the chosen congestion level"
          disabled={!selectedEdgeId}
          className="px-4 py-2 text-white rounded-xl text-xs font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer shadow-xs"
          style={{ backgroundColor: level.color }}
        >
          Log {level.short}
        </motion.button>
      </div>

      {ambulancePos && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleHere}
          title="Mark the road nearest to the ambulance pin with the chosen congestion level"
          className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
        >
          <LocateFixed className="w-4 h-4 text-[#D62828]" />
          <span>Report at Current Ambulance Coordinate</span>
        </motion.button>
      )}

      {notice && (
        <p role="status" className="text-xs font-mono rounded-xl px-3.5 py-2.5 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-start gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-px" />
          <span>{notice}</span>
        </p>
      )}

      {/* Active Incident Roster */}
      {list.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
            Active Blockages ({list.length})
          </span>
          <ul className="space-y-2">
            {list.map((item) => (
              <li
                key={item.edgeId}
                className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-slate-950/60 p-2.5 shadow-2xs"
              >
                <span
                  className="w-6 h-6 rounded-lg shrink-0 text-white text-[10px] font-black font-mono flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: item.level.color }}
                >
                  {item.level.symbol}
                </span>
                <span className="min-w-0 flex-1 font-mono">
                  <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 truncate font-sans">
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
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
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
