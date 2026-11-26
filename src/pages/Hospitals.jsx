/**
 * Hospitals Directory Page (`/hospitals`).
 * Searchable Pan-India & Delhi-NCR hospital directory with live OSRM road Distance & Est ETA
 * across all nearby facilities, specialty filters, bed intake telemetry, Lock Choice, and Call action.
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Building2,
  MapPin,
  PhoneCall,
  Bed,
  X,
  Info,
  Lock,
  Unlock,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';
import { useBedManager } from '../context/BedManagerContext.jsx';
import { computeOsrmTableMetrics } from '../services/hospitalFilterService.js';
import { WEATHER_FACTORS, TIME_OF_DAY_FACTORS } from '../data/congestionFactors.js';
import { getSearchRelevance } from '../utils/hospitalSearch.js';
import { groupHospitalsByState, resolveHospitalState } from '../utils/hospitalState.js';
import { haversineDistance, formatDistance } from '../utils/geo.js';
import { formatDuration } from '../utils/time.js';
import { HospitalBrandLogo } from '../components/ui/ProfessionalLogos.jsx';

const SPECIALTY_FILTERS = [
  { id: 'ALL', label: 'All Facilities' },
  { id: 'trauma_center', label: 'Trauma Care' },
  { id: 'ICU_READY', label: 'ICU Available' },
  { id: 'cardiology', label: 'Cardiac' },
  { id: 'burn_unit', label: 'Burn Unit' },
  { id: 'general_emergency', label: 'General' },
];

export function Hospitals() {
  const navigate = useNavigate();
  const { openBedManager } = useBedManager();
  const { routing, graph } = useDispatch();
  const {
    availableHospitals,
    topHospitals,
    rankingResult,
    ambulancePos,
    selectedHospitalId,
    setSelectedHospitalId,
    isHospitalLocked,
    toggleHospitalLock,
  } = routing;

  const [query, setQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');
  const [viewMode, setViewMode] = useState('STATE_WISE'); // 'STATE_WISE' | 'PROXIMITY'
  const [directoryMetrics, setDirectoryMetrics] = useState(() => new Map());

  const weatherMult =
    (graph.useLiveWeather && graph.liveWeather?.frictionFactor) ||
    WEATHER_FACTORS[graph.weather]?.speedMultiplier ||
    1.0;
  const timeMult = TIME_OF_DAY_FACTORS[graph.timeOfDay]?.speedMultiplier || 1.0;
  const combinedSpeedMult = Math.max(0.2, weatherMult * timeMult);

  // Fetch live OSRM driving Distance & ETA for the closest 36 hospitals across ALL specialties
  useEffect(() => {
    if (!ambulancePos?.lat || !availableHospitals?.length) return;
    let cancelled = false;
    const controller = new AbortController();

    const nearestBatch = [...availableHospitals]
      .map((h) => ({
        ...h,
        haversineM: haversineDistance(ambulancePos.lat, ambulancePos.lon, h.lat, h.lon),
      }))
      .sort((a, b) => a.haversineM - b.haversineM)
      .slice(0, 36);

    computeOsrmTableMetrics(ambulancePos, nearestBatch, { signal: controller.signal })
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return;
        const nextMap = new Map();
        for (const r of rows) {
          const baseDur = r.osrmDurationSec ?? r.durationSec ?? null;
          const calibratedSec =
            baseDur != null && combinedSpeedMult < 1
              ? Math.round(baseDur / combinedSpeedMult)
              : baseDur;
          nextMap.set(r.id, {
            distM: r.osrmDistanceM ?? r.roadDistanceM ?? null,
            etaSec: calibratedSec,
          });
        }
        setDirectoryMetrics(nextMap);
      })
      .catch(() => {
        // graceful fallback below keeps geometric estimates intact
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [ambulancePos?.lat, ambulancePos?.lon, availableHospitals, combinedSpeedMult]);

  // Combine OSRM directory metrics + active routing metrics so no facility card shows "--"
  const topMap = useMemo(() => {
    const map = new Map();
    (rankingResult?.rankedHospitals || []).forEach((h) => map.set(h.id, h));
    (topHospitals || []).forEach((h) => map.set(h.id, h));
    return map;
  }, [rankingResult?.rankedHospitals, topHospitals]);

  const filteredHospitals = useMemo(() => {
    const withDist = availableHospitals.map((h) => {
      const topMatch = topMap.get(h.id);
      const dirMatch = directoryMetrics.get(h.id);
      const straightM = haversineDistance(ambulancePos.lat, ambulancePos.lon, h.lat, h.lon);
      const straightKm = straightM / 1000;
      const roadDistM = dirMatch?.distM ?? topMatch?.distanceM ?? Math.round(straightM * 1.28);
      const estEtaSec =
        dirMatch?.etaSec ??
        topMatch?.travelTimeSec ??
        Math.round(roadDistM / (10.55 * combinedSpeedMult) + 45);
      const relevance = getSearchRelevance(h, query);
      return {
        ...h,
        resolvedState: resolveHospitalState(h),
        straightKm,
        osrmDistM: roadDistM,
        osrmEtaSec: estEtaSec,
        relevance,
      };
    });

    return withDist
      .filter((h) => {
        if (selectedState !== 'ALL' && h.resolvedState !== selectedState) return false;
        if (query.trim() && h.relevance <= 0) return false;
        if (specialtyFilter === 'ICU_READY') {
          if ((h.bedAvailability?.icuBedsFree ?? 0) <= 0) return false;
        } else if (specialtyFilter !== 'ALL') {
          if (!(h.specialties || []).includes(specialtyFilter)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (query.trim() && b.relevance !== a.relevance) return b.relevance - a.relevance;
        return a.straightKm - b.straightKm;
      });
  }, [
    availableHospitals,
    topMap,
    directoryMetrics,
    ambulancePos.lat,
    ambulancePos.lon,
    query,
    specialtyFilter,
    selectedState,
    combinedSpeedMult,
  ]);

  const allStateOptions = useMemo(
    () => groupHospitalsByState(availableHospitals),
    [availableHospitals]
  );

  const groupedByState = useMemo(
    () => groupHospitalsByState(filteredHospitals),
    [filteredHospitals]
  );

  const renderHospitalCard = (hosp) => {
    const isSelected = selectedHospitalId === hosp.id;
    const icuFree = hosp.bedAvailability?.icuBedsFree ?? 0;
    const traumaFree = hosp.bedAvailability?.traumaBedsFree ?? 0;
    const wardFree = hosp.bedAvailability?.emergencyWardFree ?? 0;

    return (
      <div
        key={hosp.id}
        className={`rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border p-4 flex flex-col justify-between gap-3 shadow-xs transition-colors ${
          isSelected
            ? 'border-[#D62828] ring-1 ring-[#D62828]/40'
            : 'border-slate-200/90 dark:border-white/[0.08]'
        }`}
      >
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2.5">
            <HospitalBrandLogo hospitalName={hosp.name} className="w-9 h-9 shrink-0 rounded-xl shadow-xs mt-0.5" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {hosp.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                {hosp.address || hosp.city || 'India Referral Network'}
              </p>
            </div>
            <StatusBadge tone={icuFree > 0 ? 'available' : 'warning'}>
              {hosp.isUserEditedBedData ? 'Edited' : 'Reference'}
            </StatusBadge>
          </div>

          {/* Facilities Chips + State Tag */}
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[11px] font-semibold text-[#D62828] dark:text-red-300">
              {hosp.resolvedState}
            </span>
            {(hosp.specialtyLabels || hosp.specialties || []).slice(0, 2).map((lbl) => (
              <span
                key={lbl}
                className="px-2 py-0.5 rounded-md bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/[0.08] text-[11px] font-medium text-slate-600 dark:text-slate-300"
              >
                {lbl}
              </span>
            ))}
          </div>

          {/* Distance, Est ETA, ICU Free, Trauma/Ward */}
          <div className="grid grid-cols-[1fr_1.25fr_0.75fr_0.95fr] gap-1.5 text-center text-xs bg-slate-50/90 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06]">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Distance</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                {formatDistance(hosp.osrmDistM)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Est ETA</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums whitespace-nowrap">
                {formatDuration(hosp.osrmEtaSec)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">ICU Free</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                {icuFree}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Trauma/Ward</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                {traumaFree}/{wardFree}
              </span>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedHospitalId(hosp.id);
              navigate('/map');
            }}
            className="flex-1 h-8 rounded-xl bg-[#D62828] hover:bg-red-700 text-white font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Route &amp; Map</span>
          </button>

          {toggleHospitalLock && isSelected && (
            <button
              type="button"
              onClick={toggleHospitalLock}
              aria-pressed={isHospitalLocked}
              className={`h-8 px-2.5 rounded-xl border font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                isHospitalLocked
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300'
                  : 'border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100'
              }`}
            >
              {isHospitalLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{isHospitalLocked ? 'Locked' : 'Lock'}</span>
            </button>
          )}

          {hosp.phone && (
            <a
              href={`tel:${hosp.phone.replace(/[^0-9+]/g, '')}`}
              className="h-8 px-2.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold inline-flex items-center gap-1 no-underline transition-colors"
              title={hosp.phone}
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
              <span>Call</span>
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Hospitals Directory"
        description={`${availableHospitals.length} referral hospitals across all ${allStateOptions.length} Indian States & Union Territories.`}
        actions={
          <button
            type="button"
            onClick={openBedManager}
            className="h-9 px-3.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Bed className="w-3.5 h-3.5 text-[#D62828] dark:text-red-400" />
            <span>Edit Bed Capacity</span>
          </button>
        }
      />

      {/* Data Transparency Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5 flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-100">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <span>
          <strong>Data Transparency:</strong> Facility locations &amp; specialties use the bundled Pan-India hospital reference dataset across all 28 States &amp; 8 Union Territories. Bed counts show local dispatcher overrides or reference estimates—always confirm live capacity by phone before arrival.
        </span>
      </div>

      {/* Filters & State-Wise Controls Row */}
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-2.5 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search hospital, city, or state across ${availableHospitals.length}…`}
              className="w-full h-9 pl-9 pr-8 text-sm bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#D62828] focus:outline-hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* State / UT Filter Dropdown */}
            <select
              aria-label="Filter by Indian State or Union Territory"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="h-9 px-3 rounded-xl text-xs font-semibold bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/90 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 focus:border-[#D62828] focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All {allStateOptions.length} States &amp; UTs ({availableHospitals.length})</option>
              {allStateOptions.map((grp) => (
                <option key={grp.state} value={grp.state}>
                  {grp.state} ({grp.totalCount})
                </option>
              ))}
            </select>

            {/* View Switcher: State-Wise vs Proximity */}
            <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-950/80 border border-slate-200/80 dark:border-white/[0.08]">
              {[
                { id: 'STATE_WISE', label: 'State-Wise' },
                { id: 'PROXIMITY', label: 'Nearest First' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setViewMode(mode.id)}
                  className={`h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    viewMode === mode.id
                      ? 'bg-[#D62828] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {SPECIALTY_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSpecialtyFilter(f.id)}
              className={`h-8 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                specialtyFilter === f.id
                  ? 'bg-[#D62828] text-white shadow-xs'
                  : 'bg-slate-50/80 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200/90 dark:border-white/[0.08]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid (State-Wise Grouped or Nearest First) */}
      {filteredHospitals.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No hospitals match your filter"
          description={`Clear the search query, state filter, or specialty filters to view all ${availableHospitals.length} registered referral hospitals.`}
          action={
            <button
              type="button"
              onClick={() => {
                setSpecialtyFilter('ALL');
                setSelectedState('ALL');
                setQuery('');
              }}
              className="h-9 px-4 rounded-xl bg-[#D62828] hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
            >
              Show All {availableHospitals.length} Hospitals
            </button>
          }
        />
      ) : viewMode === 'STATE_WISE' ? (
        <div className="space-y-6">
          {groupedByState.map((group) => (
            <section key={group.state} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/[0.08] shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D62828]" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {group.state}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {group.type} · {group.zone}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {group.totalCount} {group.totalCount === 1 ? 'Hospital' : 'Hospitals'}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {group.icuFreeTotal} ICU Free
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    {group.traumaFreeTotal} Trauma
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {group.hospitals.map(renderHospitalCard)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredHospitals.map(renderHospitalCard)}
        </div>
      )}

      {filteredHospitals.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Showing {filteredHospitals.length} of {availableHospitals.length} registered hospitals across {groupedByState.length} States &amp; Union Territories.
        </p>
      )}
    </div>
  );
}

export default Hospitals;
