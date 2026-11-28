import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowUpDown, Plus, Search, X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import IncidentTool from '../components/map/IncidentTool.jsx';
import IncidentCreateForm from '../components/incidents/IncidentCreateForm.jsx';
import IncidentDetailPanel, {
  severityTone,
  statusTone,
} from '../components/incidents/IncidentDetailPanel.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';

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
  const [sortBy, setSortBy] = useState('newest');
  const [inlineFormOpen, setInlineFormOpen] = useState(false);

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

  const handleLocateOnMap = (inc) => {
    focusIncidentOnMap(inc);
    navigate('/map');
  };

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
        <IncidentCreateForm
          onCreate={createIncident}
          onDone={() => setInlineFormOpen(false)}
        />
      )}

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
                                  handleLocateOnMap(inc);
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
                          handleLocateOnMap(inc);
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

        <div className="xl:col-span-4 space-y-4">
          <IncidentDetailPanel
            incident={activeDetail}
            assignableUnits={assignableUnits}
            onAssignUnit={assignUnitToIncident}
            onUpdateStatus={updateIncidentStatus}
            onShowOnMap={handleLocateOnMap}
          />

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
