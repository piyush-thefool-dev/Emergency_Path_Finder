/**
 * Hospital Search and Destination Selection Bar (Google Maps Style).
 * Provides location-aware proximity sorting, rapid filter chips, one-tap route dispatch,
 * emergency calling, and full coverage across all Pan-India and Delhi-NCR apex facilities.
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Hospital,
  MapPin,
  Bed,
  Navigation,
  ChevronRight,
  Check,
  Phone,
  Compass,
  Clock,
  Sparkles,
  HeartPulse,
  Flame,
  Activity,
} from 'lucide-react';
import { haversineDistance, formatDistance } from '../../utils/geo.js';
import {
  getHospitalRegion,
  estimateDrivingTime,
  getSearchRelevance,
} from '../../utils/hospitalSearch.js';

export { getSearchRelevance, getHospitalRegion, estimateDrivingTime };

const QUICK_FILTERS = [
  { id: 'all', label: 'All India', icon: Hospital },
  { id: 'nearby5', label: '< 5 km', icon: MapPin },
  { id: 'nearby15', label: '< 15 km', icon: Navigation },
  { id: 'ncr', label: 'Delhi-NCR', icon: Compass },
  { id: 'trauma', label: 'Trauma Centre', icon: Activity },
  { id: 'cardiac', label: 'Cardiac / Cath', icon: HeartPulse },
  { id: 'burn', label: 'Burn Unit', icon: Flame },
  { id: 'icu', label: 'ICU Available', icon: Bed },
];

export function HospitalSearchBar({
  hospitals = [],
  selectedHospitalId = null,
  activeHospital = null,
  onSelectHospital,
  ambulancePos = null,
  compact = false,
  embedded = false,
  autoFocus = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(embedded);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click (only in non-embedded/floating mode)
  useEffect(() => {
    if (embedded) return;
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [embedded]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Compute distances, regions, and driving times for all facilities
  const enrichedHospitals = useMemo(() => {
    return (hospitals || []).map((h) => {
      const distM =
        ambulancePos?.lat != null && ambulancePos?.lon != null && h.lat != null && h.lon != null
          ? haversineDistance(ambulancePos.lat, ambulancePos.lon, h.lat, h.lon)
          : null;
      const region = getHospitalRegion(h);
      const driveTime = estimateDrivingTime(distM);
      return { ...h, _distM: distM, _region: region, _driveTime: driveTime };
    });
  }, [hospitals, ambulancePos]);

  // Dynamic filter chip counts
  const filterCounts = useMemo(() => {
    const counts = {
      all: enrichedHospitals.length,
      nearby5: 0,
      nearby15: 0,
      ncr: 0,
      trauma: 0,
      cardiac: 0,
      burn: 0,
      icu: 0,
    };

    enrichedHospitals.forEach((h) => {
      if (h._distM != null && h._distM <= 5000) counts.nearby5++;
      if (h._distM != null && h._distM <= 15000) counts.nearby15++;
      if (h._region === 'ncr') counts.ncr++;
      if (Array.isArray(h.specialties)) {
        if (h.specialties.includes('trauma_center')) counts.trauma++;
        if (h.specialties.includes('cardiology')) counts.cardiac++;
        if (h.specialties.includes('burn_unit')) counts.burn++;
      }
      const freeIcu = h.bedAvailability?.icuBedsFree ?? 0;
      if (freeIcu > 0) counts.icu++;
    });

    return counts;
  }, [enrichedHospitals]);

  // Filter and sort hospitals
  const filteredHospitals = useMemo(() => {
    const q = query.trim().toLowerCase();

    return enrichedHospitals
      .map((h) => {
        const relevance = getSearchRelevance(h, q);
        return { ...h, _relevance: relevance };
      })
      .filter((h) => {
        // Quick filter chip logic
        if (activeFilter === 'nearby5' && (h._distM == null || h._distM > 5000)) return false;
        if (activeFilter === 'nearby15' && (h._distM == null || h._distM > 15000)) return false;
        if (activeFilter === 'ncr' && h._region !== 'ncr') return false;
        if (activeFilter === 'trauma' && !h.specialties?.includes('trauma_center')) return false;
        if (activeFilter === 'cardiac' && !h.specialties?.includes('cardiology')) return false;
        if (activeFilter === 'burn' && !h.specialties?.includes('burn_unit')) return false;
        if (activeFilter === 'icu' && (h.bedAvailability?.icuBedsFree ?? 0) <= 0) return false;

        // Search text matching (relevance > 0)
        if (q && h._relevance <= 0) return false;

        return true;
      })
      .sort((a, b) => {
        // Active destination pinned to top
        if (a.id === selectedHospitalId) return -1;
        if (b.id === selectedHospitalId) return 1;

        // When a search query is active, sort by relevance score first (highest relevance on top)
        if (q) {
          if (b._relevance !== a._relevance) {
            return b._relevance - a._relevance;
          }
          // Within same relevance tier, sort by proximity if available
          if (a._distM != null && b._distM != null) {
            return a._distM - b._distM;
          }
          if (a._distM != null) return -1;
          if (b._distM != null) return 1;
        }

        // Proximity sorting when location is active
        if (a._distM != null && b._distM != null) {
          return a._distM - b._distM;
        }
        if (a._distM != null) return -1;
        if (b._distM != null) return 1;

        // Fallback alphabetical
        return (a.shortName || a.name || '').localeCompare(b.shortName || b.name || '');
      });
  }, [enrichedHospitals, query, activeFilter, selectedHospitalId]);

  const handleSelect = (hospitalId) => {
    if (onSelectHospital) {
      onSelectHospital(hospitalId);
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    if (onSelectHospital) {
      onSelectHospital(null);
    }
    setQuery('');
  };

  const totalHospitals = hospitals.length || 155;
  const showList = embedded || isOpen;
  const hasAmbulancePos = ambulancePos?.lat != null && ambulancePos?.lon != null;

  return (
    <div
      ref={containerRef}
      className={`${embedded ? 'flex flex-col h-full min-h-0' : 'relative'} font-mono ${className}`}
    >
      {/* Search Input Bar (Google Maps Search Bar) */}
      <div className="relative flex items-center shrink-0">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
          <Search className="w-4 h-4 text-[#D62828]" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => {
            if (!embedded) setIsOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder={`Search ${totalHospitals} hospitals (e.g. AIIMS Delhi, Apollo, Kailash)...`}
          className={`w-full pl-9 pr-20 py-2 rounded-xl border text-xs font-sans transition-all backdrop-blur-md shadow-xs ${
            showList
              ? 'bg-white dark:bg-slate-900 border-[#D62828] ring-2 ring-red-500/20 text-slate-900 dark:text-slate-100'
              : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Clear search text"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : selectedHospitalId ? (
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer"
              title="Reset manual destination override back to automated CAD recommendation"
            >
              Auto CAD
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline px-1">
              {totalHospitals} Hubs
            </span>
          )}
        </div>
      </div>

      {/* Hospital List / Dropdown Menu */}
      {showList && (
        <div
          className={
            embedded
              ? 'relative w-full flex-1 min-h-0 mt-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col page-enter'
              : 'absolute left-0 right-0 top-full mt-2 z-[800] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[75vh] flex flex-col page-enter'
          }
        >
          {/* Google Maps Quick Filter Chips */}
          <div className="flex items-center gap-1.5 p-2.5 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar bg-slate-50/80 dark:bg-slate-950/70 shrink-0">
            {QUICK_FILTERS.map((chip) => {
              const Icon = chip.icon;
              const count = filterCounts[chip.id] ?? 0;
              const isActive = activeFilter === chip.id;

              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveFilter(isActive && chip.id !== 'all' ? 'all' : chip.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-sans font-medium whitespace-nowrap cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#1F3C6D] text-white shadow-xs font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3 h-3 text-[#D62828] dark:text-red-400" />
                  <span>{chip.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Location Proximity Status Header */}
          <div className="px-3.5 py-2 bg-slate-100/70 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 shrink-0 font-sans">
            <div className="flex items-center gap-1.5 truncate">
              {hasAmbulancePos ? (
                <>
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">
                    <strong>Nearest First</strong> · {filteredHospitals.length} facilities matching
                  </span>
                </>
              ) : (
                <>
                  <Hospital className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Showing {filteredHospitals.length} facilities across India</span>
                </>
              )}
            </div>

            {selectedHospitalId && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-bold text-[#D62828] dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1 shrink-0 ml-2"
              >
                <span>Reset to CAD Route</span>
              </button>
            )}
          </div>

          {/* Scrollable Google Maps Place Cards */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1.5 flex-1 space-y-1">
            {filteredHospitals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <Hospital className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  No hospitals found matching &ldquo;{query}&rdquo;
                </p>
                <p className="text-[11px]">
                  Try clearing the filter chip or searching by city (e.g. Noida, Delhi, Gurugram, Mumbai).
                </p>
                {activeFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className="mt-2 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Clear Filter ({activeFilter})
                  </button>
                )}
              </div>
            ) : (
              filteredHospitals.map((hosp) => {
                const isSelected = hosp.id === selectedHospitalId;
                const isCadBest = activeHospital && hosp.id === activeHospital.id && !selectedHospitalId;
                const beds = hosp.bedAvailability || {};
                const isTrauma = hosp.specialties?.includes('trauma_center');
                const isCardiac = hosp.specialties?.includes('cardiology');
                const isBurn = hosp.specialties?.includes('burn_unit');

                return (
                  <div
                    key={hosp.id}
                    onClick={() => handleSelect(hosp.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-950/40 dark:border-emerald-500/30 shadow-xs'
                        : isCadBest
                        ? 'bg-blue-500/10 border-blue-500/30 dark:bg-blue-950/30 dark:border-blue-500/20'
                        : 'bg-white/60 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    {/* Top Row: Name, Proximity Badge, Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-snug">
                            {hosp.name}
                          </span>

                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-600 text-white flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" />
                              ACTIVE TARGET
                            </span>
                          )}

                          {isCadBest && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-blue-600 text-white flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              CAD RECOMMENDED
                            </span>
                          )}
                        </div>

                        {/* Address */}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans line-clamp-1">
                          {hosp.address}
                        </p>
                      </div>

                      {/* Proximity / Drive Time Pill */}
                      {hosp._distM != null && (
                        <div className="text-right shrink-0">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[11px] border border-emerald-500/30">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{formatDistance(hosp._distM)}</span>
                          </div>
                          {hosp._driveTime && (
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              ~{hosp._driveTime} drive
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Middle Row: Clinical Tags & Bed Availability */}
                    <div className="mt-2 flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-1 flex-wrap">
                        {isTrauma && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 font-semibold">
                            Trauma
                          </span>
                        )}
                        {isCardiac && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 font-semibold">
                            Cardiac
                          </span>
                        )}
                        {isBurn && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-semibold">
                            Burn Unit
                          </span>
                        )}
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {hosp.institutionType || (hosp._region === 'ncr' ? 'NCR Apex' : 'Apex Center')}
                        </span>
                      </div>

                      {/* Bed Status */}
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                          <Bed className="w-3 h-3" />
                          {beds.icuBedsFree ?? 0} ICU Free
                        </span>
                        <span className="text-slate-400 hidden sm:inline">·</span>
                        <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
                          {beds.emergencyWardFree ?? 0} Ward Free
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons Row (Directions & Direct Call) */}
                    <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(hosp.id);
                          }}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold font-sans cursor-pointer transition-colors shadow-2xs ${
                            isSelected
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-[#1F3C6D] hover:bg-[#152a4d] text-white'
                          }`}
                        >
                          <Navigation className="w-3 h-3" />
                          <span>{isSelected ? 'Route Active' : 'Directions / Route'}</span>
                        </button>

                        {(hosp.phone || hosp.alternatePhone) && (
                          <a
                            href={`tel:${(hosp.phone || hosp.alternatePhone).replace(/[^0-9+]/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium font-sans border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={`Call hospital emergency desk: ${hosp.phone || hosp.alternatePhone}`}
                          >
                            <Phone className="w-3 h-3 text-[#D62828]" />
                            <span className="hidden sm:inline">Call Desk</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <span className="hidden xs:inline">Select destination</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HospitalSearchBar;
