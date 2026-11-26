/**
 * Road Conditions & Incident Sheet (Mobile Drawer).
 * Tactical layout for reporting bottlenecks, traffic accidents, or road closures.
 */

import { useMemo, useState } from 'react';
import { X, MapPin, LocateFixed, Trash2, CheckCircle2, Siren, User, Flame } from 'lucide-react';
import { TRAFFIC_LEVEL_LIST, REPORTERS } from '../../config/trafficLevels.js';
import { buildIncidentList, edgeDisplayName, extractLocalStreetSegment, findNearestEdge, timeAgo } from '../../utils/incidents.js';

export function TrafficSheet({
  open,
  onClose,
  edges,
  nodes,
  incidents,
  ambulancePos,
  reporter,
  onChangeReporter,
  onAddIncident,
  onRemoveIncident,
  onClearIncidents,
  onFocusPoint,
}) {
  const [levelId, setLevelId] = useState('heavy');
  const [notice, setNotice] = useState(null);

  const list = useMemo(() => buildIncidentList(incidents, edges, nodes), [incidents, edges, nodes]);
  const selected = TRAFFIC_LEVEL_LIST.find((l) => l.id === levelId) || TRAFFIC_LEVEL_LIST[1];

  if (!open) return null;

  const reportHere = () => {
    const hit = findNearestEdge(edges, nodes, ambulancePos);
    if (!hit) {
      setNotice({ ok: false, text: 'No mapped road within 400 m of location. Select road directly on map.' });
      return;
    }
    const a = nodes.find((n) => n.id === hit.edge.from);
    const b = nodes.find((n) => n.id === hit.edge.to);
    const pt = ambulancePos ? [ambulancePos.lat, ambulancePos.lon] : [hit.midpoint.lat, hit.midpoint.lon];
    const clip = a && b ? extractLocalStreetSegment([[a.lat, a.lon], [b.lat, b.lon]], pt, 42) : null;
    onAddIncident(hit.edge.id, levelId, {
      point: clip?.point || pt,
      roadName: edgeDisplayName(hit.edge),
      streetSegment: clip?.streetSegment || (a && b ? [[a.lat, a.lon], [b.lat, b.lon]] : null),
    });
    setNotice({ ok: true, text: `${selected.label} logged on ${edgeDisplayName(hit.edge)}.` });
  };

  return (
    <div className="absolute inset-0 z-[700] flex flex-col justify-end pointer-events-none">
      <button
        type="button"
        aria-label="Close road conditions"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 pointer-events-auto cursor-default backdrop-blur-xs transition-opacity"
      />
      <div className="relative pointer-events-auto max-h-[78%] overflow-y-auto rounded-t-2xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl page-enter px-4 pt-3 pb-6 font-mono">
        <div className="mx-auto w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mb-3" />

        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#D62828]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider">
              Road Conditions & Closures
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reporter Toggle */}
        <div className="mt-3 grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          {REPORTERS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChangeReporter(r)}
              title={r === 'Public' ? 'Tag report as public user' : 'Tag report as ambulance unit'}
              aria-pressed={reporter === r}
              className={`py-1.5 rounded-md font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                reporter === r
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {r === 'Public' ? <User className="w-3.5 h-3.5" /> : <Siren className="w-3.5 h-3.5" />}
              {r === 'Public' ? 'Citizen' : 'Ambulance Crew'}
            </button>
          ))}
        </div>

        {/* Level Selector */}
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {TRAFFIC_LEVEL_LIST.map((lvl) => {
            const on = lvl.id === levelId;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setLevelId(lvl.id)}
                className={`p-2.5 rounded-lg border text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
                  on
                    ? 'text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
                style={on ? { backgroundColor: lvl.color, borderColor: lvl.color } : undefined}
              >
                <span
                  className="w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 border border-white/40"
                  style={{ backgroundColor: lvl.color, color: '#fff' }}
                >
                  {lvl.symbol}
                </span>
                <span className="truncate">{lvl.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Report Button */}
        {ambulancePos && (
          <button
            type="button"
            onClick={reportHere}
            className="mt-3 w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-98 transition-all"
          >
            <LocateFixed className="w-3.5 h-3.5 text-[#D62828]" />
            Inject at Current Coordinate
          </button>
        )}

        {notice && (
          <p
            role="status"
            className={`mt-2.5 text-xs rounded-lg p-2.5 flex items-start gap-2 ${
              notice.ok
                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-500/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{notice.text}</span>
          </p>
        )}

        {/* Active Blockages Roster */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Active Obstructions ({list.length})
            </span>
            {list.length > 0 && (
              <button
                type="button"
                onClick={onClearIncidents}
                className="text-[10px] text-[#D62828] dark:text-red-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>

          {list.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">
              No active incidents reported. All roads in normal flow.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {list.map((item) => (
                <li
                  key={item.edgeId}
                  className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60"
                >
                  <span
                    className="w-5 h-5 rounded-md text-[10px] font-black text-white flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.level.color }}
                  >
                    {item.level.symbol}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {item.level.label} · {item.reportedBy} · {timeAgo(item.timestamp)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveIncident(item.edgeId)}
                    title="Clear road"
                    className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrafficSheet;
