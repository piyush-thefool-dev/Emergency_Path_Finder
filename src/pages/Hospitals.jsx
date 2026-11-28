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
  Bed,
  X,
  Info,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import DisclaimerBanner from '../components/layout/DisclaimerBanner.jsx';
import ResultCard from '../components/panels/ResultCard.jsx';
import HospitalDirectoryCard from '../components/hospitals/HospitalDirectoryCard.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';
import { useBedManager } from '../context/BedManagerContext.jsx';
import { computeOsrmTableMetrics } from '../services/hospitalFilterService.js';
import { WEATHER_FACTORS, TIME_OF_DAY_FACTORS } from '../data/congestionFactors.js';
import { getSearchRelevance } from '../utils/hospitalSearch.js';
import { groupHospitalsByState, resolveHospitalState } from '../utils/hospitalState.js';
import { haversineDistance } from '../utils/geo.js';

const SPECIALTY_FILTERS = [
  { id: 'ALL', label: 'All Facilities' },
  { id: 'trauma_center', label: 'Trauma Care' },
  { id: 'ICU_READY', label: 'ICU Available' },
  { id: 'cardiology', label: 'Cardiac' },
  { id: 'burn_unit', label: 'Burn Unit' },
  { id: 'general_emergency', label: 'General' },
];

export function Hospitals({ showActiveRecommendation = false }) {
  const navigate = useNavigate();
  const { openBedManager } = useBedManager();
  const { routing, graph } = useDispatch();
  const {
    availableHospitals,
    topHospitals,
    rankingResult,
    activeHospital,
    ambulancePos,
    selectedHospitalId,
    setSelectedHospitalId,
    isHospitalLocked,
    toggleHospitalLock,
    snappedSourceNode,
    algorithm,
    wibApiStatus,
    refreshWibData,
    isSyncingWib,
  } = routing;

  const [query, setQuery] = useState('');
  const [stateQueries, setStateQueries] = useState(() => ({}));
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');
  const [viewMode, setViewMode] = useState('STATE_WISE'); // 'STATE_WISE' | 'PROXIMITY'
  const [collapsedStates, setCollapsedStates] = useState(() => new Set());
  const [expandedAllInState, setExpandedAllInState] = useState(() => new Set());
  const [proximityLimit, setProximityLimit] = useState(48);
  const [directoryMetrics, setDirectoryMetrics] = useState(() => new Map());

  const updateStateQuery = (stateName, value) => {
    setStateQueries((prev) => {
      if (!value) {
        const next = { ...prev };
        delete next[stateName];
        return next;
      }
      return { ...prev, [stateName]: value };
    });
    if (value.trim()) {
      setCollapsedStates((prev) => {
        if (!prev.has(stateName)) return prev;
        const next = new Set(prev);
        next.delete(stateName);
        return next;
      });
    }
  };

  const toggleStateCollapse = (stateName) => {
    setCollapsedStates((prev) => {
      const next = new Set(prev);
      if (next.has(stateName)) next.delete(stateName);
      else next.add(stateName);
      return next;
    });
  };

  const toggleShowAllInState = (stateName) => {
    setExpandedAllInState((prev) => {
      const next = new Set(prev);
      if (next.has(stateName)) next.delete(stateName);
      else next.add(stateName);
      return next;
    });
  };

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

  const renderHospitalCard = (hosp) => (
    <HospitalDirectoryCard
      key={hosp.id}
      hosp={hosp}
      isSelected={selectedHospitalId === hosp.id}
      isHospitalLocked={isHospitalLocked}
      onSelectAndRoute={(id) => {
        setSelectedHospitalId(id);
        navigate('/map');
      }}
      onToggleLock={toggleHospitalLock}
    />
  );

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

      {showActiveRecommendation && (
        <div className="space-y-4">
          <DisclaimerBanner />
          <ResultCard
            hospital={activeHospital}
            alternateHospitals={rankingResult.alternateCandidates}
            searchHospitals={routing.searchHospitals}
            selectedHospitalId={selectedHospitalId}
            onSelectHospital={setSelectedHospitalId}
            isHospitalLocked={isHospitalLocked}
            onToggleHospitalLock={toggleHospitalLock}
            sourceNode={snappedSourceNode}
            algorithm={algorithm}
            isFigure2Mode={false}
            wibApiStatus={wibApiStatus}
            onRefreshWib={refreshWibData}
            isSyncingWib={isSyncingWib}
            onOpenBedManager={openBedManager}
          />
        </div>
      )}

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
        <div className="space-y-4">
          {groupedByState.map((group) => {
            const localQuery = stateQueries[group.state] || '';
            const hasLocalQuery = Boolean(localQuery.trim());
            const forceExpanded = Boolean(query.trim()) || hasLocalQuery || selectedState !== 'ALL';
            const isCollapsed = !forceExpanded && collapsedStates.has(group.state);
            const stateHospitals = hasLocalQuery
              ? group.hospitals
                  .map((h) => ({ h, score: getSearchRelevance(h, localQuery) }))
                  .filter((item) => item.score > 0)
                  .sort((a, b) => b.score - a.score || a.h.straightKm - b.h.straightKm)
                  .map((item) => item.h)
              : group.hospitals;
            const showAllCards = forceExpanded || expandedAllInState.has(group.state);
            const visibleCards = showAllCards ? stateHospitals : stateHospitals.slice(0, 9);

            return (
              <section key={group.state} className="space-y-3">
                <div className="w-full flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] shadow-xs transition-colors">
                  <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleStateCollapse(group.state)}
                      aria-expanded={!isCollapsed}
                      className="flex items-center gap-2.5 cursor-pointer text-left shrink-0"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#D62828] shrink-0" />
                      )}
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {group.state}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {group.type} · {group.zone}
                      </span>
                    </button>

                    {/* Per-State Search Box next to State Name */}
                    <div className="relative w-full sm:w-64 md:w-72 shrink-0">
                      <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={localQuery}
                        onChange={(e) => updateStateQuery(group.state, e.target.value)}
                        placeholder={`Search in ${group.state}…`}
                        aria-label={`Search hospitals in ${group.state}`}
                        className="w-full h-8 pl-8 pr-7 text-xs bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#D62828] focus:outline-hidden transition-colors"
                      />
                      {localQuery && (
                        <button
                          type="button"
                          onClick={() => updateStateQuery(group.state, '')}
                          aria-label={`Clear ${group.state} search`}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleStateCollapse(group.state)}
                    className="flex items-center gap-3 text-xs font-mono cursor-pointer shrink-0"
                  >
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {hasLocalQuery ? `${stateHospitals.length} / ${group.totalCount}` : group.totalCount}{' '}
                      {group.totalCount === 1 ? 'Hospital' : 'Hospitals'}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {group.icuFreeTotal} ICU Free
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      {group.traumaFreeTotal} Trauma
                    </span>
                  </button>
                </div>

                {!isCollapsed && (
                  <>
                    {stateHospitals.length === 0 ? (
                      <div className="rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.06] px-4 py-4 flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
                        <span>
                          No facilities in <strong>{group.state}</strong> match &ldquo;{localQuery}&rdquo;.
                        </span>
                        <button
                          type="button"
                          onClick={() => updateStateQuery(group.state, '')}
                          className="px-2.5 py-1 rounded-lg bg-[#D62828] text-white font-semibold cursor-pointer shrink-0"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {visibleCards.map(renderHospitalCard)}
                      </div>
                    )}
                    {stateHospitals.length > 9 && (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => toggleShowAllInState(group.state)}
                          className="h-8 px-4 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                        >
                          {showAllCards
                            ? `Show Fewer in ${group.state}`
                            : `Show All ${stateHospitals.length} Hospitals in ${group.state}`}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredHospitals.slice(0, proximityLimit).map(renderHospitalCard)}
          </div>
          {filteredHospitals.length > proximityLimit && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setProximityLimit((n) => n + 48)}
                className="h-9 px-5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer transition-colors"
              >
                Load More ({filteredHospitals.length - proximityLimit} remaining)
              </button>
            </div>
          )}
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
