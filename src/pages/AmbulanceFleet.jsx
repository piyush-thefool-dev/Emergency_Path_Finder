/**
 * Ambulance Fleet Management Page (`/fleet`).
 * Separates live active vehicle telemetry (AMB-01 connected to Browser GPS / Routing)
 * cleanly from verified graph staging roster units (AMB-02..AMB-04).
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Truck, MapPin, Locate, Navigation, X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';
import { formatDistance } from '../utils/geo.js';
import { formatDuration } from '../utils/time.js';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All Units' },
  { id: 'AVAILABLE', label: 'Available' },
  { id: 'DISPATCHED', label: 'Dispatched' },
  { id: 'EN_ROUTE', label: 'En Route' },
  { id: 'TRANSPORTING', label: 'Transporting' },
  { id: 'OUT_OF_SERVICE', label: 'Out of Service' },
];

function unitStatusTone(status) {
  if (status === 'AVAILABLE') return 'available';
  if (status === 'EN_ROUTE' || status === 'DISPATCHED' || status === 'TRANSPORTING') return 'progress';
  if (status === 'AT_INCIDENT') return 'warning';
  return 'neutral';
}

export function AmbulanceFleet() {
  const navigate = useNavigate();
  const {
    fleetUnits,
    selectedUnitId,
    setSelectedUnitId,
    activateFleetUnitOnMap,
    live,
    dispatchIncidents,
    assignUnitToIncident,
  } = useDispatch();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const openIncidents = dispatchIncidents.filter((i) => i.status !== 'RESOLVED');

  const filteredUnits = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fleetUnits.filter((u) => {
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
      if (!q) return true;
      return (
        u.id.toLowerCase().includes(q) ||
        u.registration.toLowerCase().includes(q) ||
        u.unitType.toLowerCase().includes(q) ||
        u.locationName.toLowerCase().includes(q)
      );
    });
  }, [fleetUnits, query, statusFilter]);

  const activeUnit = fleetUnits.find((u) => u.id === selectedUnitId) || filteredUnits[0] || null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ambulance Fleet"
        description="Monitor unit availability, real-time GPS tracking on AMB-01, and dispatch assignments."
        actions={
          !live.isGpsActive ? (
            <button
              type="button"
              onClick={live.startGps}
              className="h-9 px-3.5 rounded-lg bg-[#D62828] hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Locate className="w-3.5 h-3.5" />
              <span>Enable AMB-01 Device GPS</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={live.stopGps}
              className="h-9 px-3.5 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200/90 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-semibold cursor-pointer"
            >
              Stop Device GPS
            </button>
          )
        }
      />

      {/* Search & Status Pills */}
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search unit ID, registration, or station…"
            className="w-full h-9 pl-9 pr-8 text-sm bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/90 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#D62828] focus:outline-hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`h-8 px-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                statusFilter === f.id
                  ? 'bg-[#D62828] text-white'
                  : 'bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-white/[0.08]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Fleet Table + Unit Details Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-8">
          {filteredUnits.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No matching ambulances"
              description="No fleet units match your search or status filter."
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 font-medium">
                      <tr>
                        <th className="py-3 px-3">Unit</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Location / Origin</th>
                        <th className="py-3 px-3">Destination</th>
                        <th className="py-3 px-3 whitespace-nowrap">Calc ETA</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                      {filteredUnits.map((unit) => (
                        <tr
                          key={unit.id}
                          onClick={() => setSelectedUnitId(unit.id)}
                          className={`cursor-pointer transition-colors ${
                            activeUnit?.id === unit.id ? 'bg-red-50/90 dark:bg-red-950/35 ring-1 ring-inset ring-[#D62828]/40' : 'hover:bg-slate-100/90 dark:hover:bg-slate-800/70'
                          }`}
                        >
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">{unit.id}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{unit.registration}</div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <StatusBadge tone={unitStatusTone(unit.status)} dot>
                              {unit.status.replace('_', ' ')}
                            </StatusBadge>
                          </td>
                          <td className="py-3 px-2.5 max-w-[140px]">
                            <div className="text-slate-900 dark:text-slate-100 truncate">{unit.locationName}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {unit.isStagingRoster ? 'Staging Roster' : unit.isGpsLive ? 'Live Device GPS' : 'Active Map Pin'}
                            </div>
                          </td>
                          <td className="py-3 px-2.5 max-w-[130px] truncate text-slate-900 dark:text-slate-100">
                            {unit.destinationName || <span className="text-slate-500 dark:text-slate-400">Standby</span>}
                          </td>
                          <td className="py-3 px-2.5 font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {unit.etaSec > 0 ? formatDuration(unit.etaSec) : '--'}
                          </td>
                          <td className="py-3 px-2.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                activateFleetUnitOnMap(unit);
                                navigate('/map');
                              }}
                              className="px-2.5 py-1 rounded-md border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#D62828] dark:text-red-400 font-medium cursor-pointer"
                            >
                              Focus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredUnits.map((unit) => (
                  <div
                    key={unit.id}
                    onClick={() => setSelectedUnitId(unit.id)}
                    className={`bg-white/80 dark:bg-slate-900/80 border rounded-xl p-4 space-y-2.5 ${
                      activeUnit?.id === unit.id ? 'border-[#D62828]' : 'border-slate-200/80 dark:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">{unit.id}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">{unit.registration}</span>
                      </div>
                      <StatusBadge tone={unitStatusTone(unit.status)} dot>
                        {unit.status.replace('_', ' ')}
                      </StatusBadge>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{unit.unitType}</div>
                    <div className="text-xs text-slate-900 dark:text-slate-100">Location: {unit.locationName}</div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/[0.08] text-xs">
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {unit.etaSec > 0 ? `ETA: ${formatDuration(unit.etaSec)}` : 'Standby'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          activateFleetUnitOnMap(unit);
                          navigate('/map');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#D62828] text-white font-medium cursor-pointer"
                      >
                        View on Map
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: Unit Details & Incident Assignment */}
        <div className="xl:col-span-4">
          {activeUnit && (
            <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
                <div>
                  <div className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">{activeUnit.id}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{activeUnit.unitType}</div>
                </div>
                <StatusBadge tone={unitStatusTone(activeUnit.status)} dot>
                  {activeUnit.status.replace('_', ' ')}
                </StatusBadge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Registration</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">{activeUnit.registration}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Position</span>
                  <span className="text-slate-900 dark:text-slate-100 text-right">{activeUnit.locationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Assigned Emergency</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {activeUnit.assignedIncidentId || 'None'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Receiving Destination</span>
                  <span className="text-slate-900 dark:text-slate-100 text-right">{activeUnit.destinationName || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Route ETA / Distance</span>
                  <span className="font-mono text-[#D62828] dark:text-red-400">
                    {activeUnit.etaSec > 0
                      ? `${formatDuration(activeUnit.etaSec)} · ${formatDistance(activeUnit.distanceM)}`
                      : 'Calculated upon dispatch'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Telemetry Source</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {activeUnit.isStagingRoster ? 'Static Staging Node' : activeUnit.isGpsLive ? 'Hardware GPS' : 'Interactive Origin'}
                  </span>
                </div>
              </div>

              {activeUnit.status !== 'OUT_OF_SERVICE' && openIncidents.length > 0 && (
                <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] space-y-2">
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-100">
                    Dispatch to Active Incident
                  </label>
                  <select
                    aria-label="Assign fleet unit to emergency"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        assignUnitToIncident(e.target.value, activeUnit.id);
                        navigate('/map');
                      }
                    }}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select open incident…</option>
                    {openIncidents.map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        {inc.id} · {inc.typeLabel} ({inc.severity})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    activateFleetUnitOnMap(activeUnit);
                    navigate('/map');
                  }}
                  className="h-9 px-3 rounded-lg bg-[#D62828] hover:bg-red-700 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Locate on Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    activateFleetUnitOnMap(activeUnit);
                    navigate('/routing');
                  }}
                  className="h-9 px-3 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#D62828] dark:text-red-400" />
                  <span>Plan Route</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AmbulanceFleet;
