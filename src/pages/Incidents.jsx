/**
 * Emergency Incidents Management Page (`/incidents`).
 * Supports search, severity & status filtering, sorting, structured side detail drawer,
 * ambulance assignment, map focus, and road-segment blockage tracking.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  MapPin,
  Truck,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import IncidentTool from '../components/map/IncidentTool.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';
import { EMERGENCY_CATEGORIES } from '../config/emergencyCategories.js';

function severityTone(sev) {
  if (sev === 'CRITICAL') return 'critical';
  if (sev === 'HIGH') return 'warning';
  return 'neutral';
}

function statusTone(st) {
  if (st === 'OPEN') return 'critical';
  if (st === 'IN_PROGRESS' || st === 'DISPATCHED') return 'progress';
  if (st === 'RESOLVED') return 'resolved';
  return 'neutral';
}

function formatTimeAgo(iso) {
  if (!iso) return '--';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}

export function Incidents({ onOpenNewEmergency }) {
  const navigate = useNavigate();
  const {
    dispatchIncidents,
    selectedIncidentId,
    setSelectedIncidentId,
    updateIncidentStatus,
    assignUnitToIncident,
    focusIncidentOnMap,
    createIncident,
    fleetUnits,
    graph,
    routing,
  } = useDispatch();

  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'severity'
  const [inlineFormOpen, setInlineFormOpen] = useState(false);
  const [inlineLocName, setInlineLocName] = useState('');
  const [inlineType, setInlineType] = useState('TRAUMA');
  const [inlineSeverity, setInlineSeverity] = useState('CRITICAL');

  const filteredIncidents = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = dispatchIncidents.filter((inc) => {
      if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
      if (!q) return true;
      return (
        inc.id.toLowerCase().includes(q) ||
        inc.typeLabel.toLowerCase().includes(q) ||
        inc.locationName.toLowerCase().includes(q) ||
        (inc.assignedUnitId || '').toLowerCase().includes(q)
      );
    });

    const sevRank = { CRITICAL: 3, HIGH: 2, MODERATE: 1 };
    return [...list].sort((a, b) => {
      if (sortBy === 'severity') {
        const diff = (sevRank[b.severity] || 0) - (sevRank[a.severity] || 0);
        if (diff !== 0) return diff;
      }
      return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
    });
  }, [dispatchIncidents, query, severityFilter, statusFilter, sortBy]);

  const activeDetail =
    dispatchIncidents.find((i) => i.id === selectedIncidentId) || filteredIncidents[0] || null;

  const assignableUnits = fleetUnits.filter((u) => u.status !== 'OUT_OF_SERVICE');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Emergency Incidents"
        description="Manage dispatch requests, assign available ambulances, and track road-segment blockages."
        actions={
          <button
            type="button"
            onClick={() => {
              if (onOpenNewEmergency) onOpenNewEmergency();
              else setInlineFormOpen((v) => !v);
            }}
            className="h-9 px-3.5 rounded-lg bg-[#D62828] hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{inlineFormOpen ? 'Cancel' : 'Report Emergency'}</span>
          </button>
        }
      />

      {inlineFormOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createIncident({
              locationName: inlineLocName.trim() || 'Active Dispatch Sector',
              type: inlineType,
              typeLabel: EMERGENCY_CATEGORIES[inlineType]?.label || inlineType,
              severity: inlineSeverity,
              assignedUnitId: 'AMB-01',
              focusMap: false,
            });
            setInlineLocName('');
            setInlineFormOpen(false);
          }}
          className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-[#D62828]/40 p-4 space-y-3 text-xs"
        >
          <div className="font-bold text-slate-900 dark:text-slate-100">Log Emergency Incident</div>
          <input
            type="text"
            required
            value={inlineLocName}
            onChange={(e) => setInlineLocName(e.target.value)}
            placeholder="Pickup Location / Sector (e.g. Pari Chowk)"
            className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label="New incident category"
              value={inlineType}
              onChange={(e) => setInlineType(e.target.value)}
              className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100"
            >
              {Object.values(EMERGENCY_CATEGORIES).map((c) => (
                <option key={c.id} value={c.id}>{c.shortLabel}</option>
              ))}
            </select>
            <select
              aria-label="New incident severity"
              value={inlineSeverity}
              onChange={(e) => setInlineSeverity(e.target.value)}
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
      )}

      {/* Filter & Search Bar */}
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by ID, location, emergency type, or unit…"
            className="w-full h-9 pl-9 pr-8 text-sm bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/90 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#D62828] focus:outline-hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 cursor-pointer"
              aria-label="Clear filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            aria-label="Filter by severity"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High Priority</option>
            <option value="MODERATE">Moderate</option>
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <button
            type="button"
            onClick={() => setSortBy((s) => (s === 'newest' ? 'severity' : 'newest'))}
            className="h-9 px-3 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Sort: {sortBy === 'newest' ? 'Newest' : 'Severity'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Split: Queue Table/Cards + Detail Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-8">
          {filteredIncidents.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No matching incidents"
              description="Adjust your severity or status filters, or report a new emergency incident."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSeverityFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="h-9 px-4 rounded-lg bg-[#D62828] text-white text-xs font-medium cursor-pointer"
                >
                  Reset Filters
                </button>
              }
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 font-medium">
                      <tr>
                        <th className="py-3 px-3">Incident</th>
                        <th className="py-3 px-3">Type &amp; Location</th>
                        <th className="py-3 px-3">Severity</th>
                        <th className="py-3 px-3">Unit</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                      {filteredIncidents.map((inc) => {
                        const selected = activeDetail?.id === inc.id;
                        return (
                          <tr
                            key={inc.id}
                            onClick={() => setSelectedIncidentId(inc.id)}
                            className={`cursor-pointer transition-colors ${
                              selected ? 'bg-red-50/90 dark:bg-red-950/35 ring-1 ring-inset ring-[#D62828]/40' : 'hover:bg-slate-100/90 dark:hover:bg-slate-800/70'
                            }`}
                          >
                            <td className="py-3 px-3 align-top whitespace-nowrap">
                              <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">{inc.id}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                                {formatTimeAgo(inc.reportedAt)}
                              </div>
                            </td>
                            <td className="py-3 px-3 align-top max-w-[200px]">
                              <div className="font-medium text-slate-900 dark:text-slate-100">{inc.typeLabel}</div>
                              <div className="text-slate-500 dark:text-slate-400 truncate mt-0.5">{inc.locationName}</div>
                            </td>
                            <td className="py-3 px-3 align-top whitespace-nowrap">
                              <StatusBadge tone={severityTone(inc.severity)}>{inc.severity}</StatusBadge>
                            </td>
                            <td className="py-3 px-3 align-top font-mono text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              {inc.assignedUnitId || <span className="text-slate-500 dark:text-slate-400">Unassigned</span>}
                            </td>
                            <td className="py-3 px-3 align-top whitespace-nowrap">
                              <StatusBadge tone={statusTone(inc.status)} dot>
                                {inc.status.replace('_', ' ')}
                              </StatusBadge>
                            </td>
                            <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  focusIncidentOnMap(inc);
                                  navigate('/map');
                                }}
                                className="px-2.5 py-1 rounded-md border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#D62828] dark:text-red-400 font-medium cursor-pointer"
                              >
                                Map
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className={`bg-white/80 dark:bg-slate-900/80 border rounded-xl p-4 space-y-2.5 ${
                      activeDetail?.id === inc.id ? 'border-[#D62828]' : 'border-slate-200/80 dark:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{inc.id}</span>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge tone={severityTone(inc.severity)}>{inc.severity}</StatusBadge>
                        <StatusBadge tone={statusTone(inc.status)} dot>
                          {inc.status.replace('_', ' ')}
                        </StatusBadge>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{inc.typeLabel}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{inc.locationName}</div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/[0.08] text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        Unit: <strong className="font-mono text-slate-900 dark:text-slate-100">{inc.assignedUnitId || 'Unassigned'}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          focusIncidentOnMap(inc);
                          navigate('/map');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#D62828] text-white font-medium cursor-pointer"
                      >
                        Locate on Map
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Structured Incident Detail Panel */}
        <div className="xl:col-span-4 space-y-4">
          {activeDetail && (
            <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{activeDetail.id}</span>
                    <StatusBadge tone={severityTone(activeDetail.severity)}>
                      {activeDetail.severity}
                    </StatusBadge>
                  </div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    {activeDetail.typeLabel}
                  </h2>
                </div>
                <StatusBadge tone={statusTone(activeDetail.status)} dot>
                  {activeDetail.status.replace('_', ' ')}
                </StatusBadge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Location</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{activeDetail.locationName}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Coordinates</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                    {activeDetail.lat.toFixed(4)}, {activeDetail.lon.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Data Origin</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {activeDetail.isDemoScenario ? 'Sample Dispatch Scenario' : 'Operator Logged'}
                  </span>
                </div>
              </div>

              {activeDetail.notes && (
                <div className="p-3 rounded-lg bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/90 dark:border-white/[0.08] text-xs text-slate-900 dark:text-slate-100">
                  {activeDetail.notes}
                </div>
              )}

              {/* Ambulance Assignment Workflow */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-100">
                  Assign / Switch Ambulance
                </label>
                <div className="flex gap-2">
                  <select
                    aria-label="Assign ambulance unit"
                    value={activeDetail.assignedUnitId || ''}
                    onChange={(e) => {
                      if (e.target.value) assignUnitToIncident(activeDetail.id, e.target.value);
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

              {/* Operational Status Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    focusIncidentOnMap(activeDetail);
                    navigate('/map');
                  }}
                  className="h-9 px-3 rounded-lg bg-[#D62828] hover:bg-red-700 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Show on Map</span>
                </button>

                {activeDetail.status !== 'RESOLVED' ? (
                  <button
                    type="button"
                    onClick={() => updateIncidentStatus(activeDetail.id, 'RESOLVED')}
                    className="h-9 px-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateIncidentStatus(activeDetail.id, 'OPEN')}
                    className="h-9 px-3 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium cursor-pointer"
                  >
                    Reopen Case
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Road Congestion & Corridor Segment Obstructions Tool */}
          <IncidentTool
            edges={graph.weightedGraph.edges}
            nodes={graph.weightedGraph.nodes}
            incidents={graph.incidents}
            ambulancePos={routing.ambulancePos}
            reporter={graph.reporter}
            onChangeReporter={graph.setReporter}
            onAddIncident={graph.addIncident}
            onRemoveIncident={graph.removeIncident}
            onClearIncidents={graph.clearIncidents}
            timeOfDay={graph.timeOfDay}
            weather={graph.weather}
          />
        </div>
      </div>
    </div>
  );
}

export default Incidents;
