/**
 * Enterprise Top Command Bar for Web/Desktop (`>= 1024px`).
 * Styled cleanly in the current Light & Dark frosted glass CAD design with Global Search,
 * Emergency Report trigger, Alerts feed, Osm status pill, and Theme toggle.
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Radio,
  Building2,
  X,
  Plus,
  Truck,
  AlertTriangle,
  Bed,
} from 'lucide-react';
import { useDispatch } from '../../context/DispatchContext.jsx';
import { useBedManager } from '../../context/BedManagerContext.jsx';
import { getSearchRelevance } from '../../utils/hospitalSearch.js';
import { isOffline, subscribeNetworkStatus } from '../../utils/network.js';

export function DesktopTopBar({ onQuickReportEmergency }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const {
    routing,
    graph,
    dispatchIncidents,
    fleetUnits,
    focusIncidentOnMap,
    activateFleetUnitOnMap,
  } = useDispatch();
  const { openBedManager } = useBedManager();

  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isNetOffline, setIsNetOffline] = useState(() => isOffline());

  const searchRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => subscribeNetworkStatus((online) => setIsNetOffline(!online)), []);

  useEffect(() => {
    function handleOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const roadIncidentCount = graph.incidents instanceof Map ? graph.incidents.size : 0;
  const openEmergencies = dispatchIncidents.filter((i) => i.status !== 'RESOLVED');
  const alertCount = openEmergencies.length + roadIncidentCount;

  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) return { hospitals: [], incidents: [], units: [] };
    const ql = q.toLowerCase();

    const incidents = dispatchIncidents
      .filter(
        (i) =>
          i.id.toLowerCase().includes(ql) ||
          i.locationName.toLowerCase().includes(ql) ||
          i.typeLabel.toLowerCase().includes(ql)
      )
      .slice(0, 3);

    const units = fleetUnits
      .filter(
        (u) =>
          u.id.toLowerCase().includes(ql) ||
          u.registration.toLowerCase().includes(ql) ||
          u.locationName.toLowerCase().includes(ql)
      )
      .slice(0, 3);

    const hospitals = (routing.searchHospitals || [])
      .map((h) => ({ h, score: getSearchRelevance(h, q) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.h);

    return { hospitals, incidents, units };
  }, [query, dispatchIncidents, fleetUnits, routing.searchHospitals]);

  const hasResults =
    searchResults.hospitals.length > 0 ||
    searchResults.incidents.length > 0 ||
    searchResults.units.length > 0;

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.08] px-6 flex items-center justify-between gap-4 shrink-0 transition-colors">
      {/* Global Multi-Entity Search */}
      <div ref={searchRef} className="relative flex-1 max-w-xl">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setSearchFocused(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchFocused(true);
          }}
          placeholder={`Search incidents, fleet units, or ${routing.availableHospitals?.length || 5000} hospitals…`}
          aria-label="Global dispatch search"
          className="w-full h-9 pl-9 pr-8 text-sm bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#D62828] focus:outline-hidden transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {searchFocused && query.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden z-50">
            {!hasResults ? (
              <div className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                No matching emergencies, units, or hospitals for &ldquo;{query}&rdquo;.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-80 overflow-y-auto">
                {searchResults.incidents.map((inc) => (
                  <button
                    key={inc.id}
                    type="button"
                    onClick={() => {
                      focusIncidentOnMap(inc);
                      setSearchFocused(false);
                      setQuery('');
                      navigate('/map');
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AlertTriangle className="w-4 h-4 text-[#D62828] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {inc.id} · {inc.typeLabel}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{inc.locationName}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-[#D62828] dark:text-red-400 shrink-0">Focus</span>
                  </button>
                ))}

                {searchResults.units.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      activateFleetUnitOnMap(u);
                      setSearchFocused(false);
                      setQuery('');
                      navigate('/fleet');
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {u.id} ({u.registration})
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.locationName}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">{u.status}</span>
                  </button>
                ))}

                {searchResults.hospitals.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      routing.setSelectedHospitalId(h.id);
                      setSearchFocused(false);
                      setQuery('');
                      if (pathname !== '/' && pathname !== '/map') {
                        navigate('/map');
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{h.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {h.address || h.city || 'India Referral Network'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0">Route</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Status & Quick Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onQuickReportEmergency && (
          <button
            type="button"
            onClick={onQuickReportEmergency}
            className="h-9 px-3 rounded-xl bg-[#D62828] hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Emergency</span>
          </button>
        )}

        <button
          type="button"
          onClick={openBedManager}
          className="h-9 px-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Bed className="w-3.5 h-3.5 text-[#D62828] dark:text-red-400" />
          <span>Bed Registry</span>
        </button>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-mono font-semibold ${
            isNetOffline
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
          }`}
        >
          <Radio className="w-3.5 h-3.5 shrink-0" />
          <span>{isNetOffline ? 'Offline Graph CAD' : 'OSM Routing Active'}</span>
        </div>

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Open notifications"
            title="Active emergency & road notifications"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D62828] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                {alertCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                  Active Notifications ({alertCount})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    navigate('/incidents');
                  }}
                  className="text-xs font-semibold text-[#D62828] dark:text-red-400 hover:underline cursor-pointer"
                >
                  Open Queue
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                {openEmergencies.map((inc) => (
                  <button
                    key={inc.id}
                    type="button"
                    onClick={() => {
                      focusIncidentOnMap(inc);
                      setNotifOpen(false);
                      navigate('/map');
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#D62828] dark:text-red-400">
                        {inc.id} · {inc.severity}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {inc.assignedUnitId || 'Unassigned'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-900 dark:text-slate-100 font-medium mt-0.5 truncate">
                      {inc.locationName}
                    </div>
                  </button>
                ))}
                {roadIncidentCount > 0 && (
                  <div className="px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10">
                    {roadIncidentCount} active road closure/congestion report(s) affecting routing.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

export default DesktopTopBar;
