import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Activity,
  Bed,
  Compass,
  Flame,
  HeartPulse,
  Hospital,
  MapPin,
  Navigation,
  Search,
  X,
} from 'lucide-react';
import {
  getHospitalRegion,
  estimateDrivingTime,
  getSearchRelevance,
  enrichHospitalsWithDistance,
  computeHospitalFilterCounts,
  filterAndSortHospitals,
} from '../../utils/hospitalSearch.js';
import HospitalSearchResultItem from './HospitalSearchResultItem.jsx';

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

export const SEARCH_RADIUS_KM = 100;
export const SEARCH_MAX_RADIUS_M = SEARCH_RADIUS_KM * 1000;

export function HospitalSearchBar({
  hospitals = [],
  selectedHospitalId = null,
  activeHospital = null,
  onSelectHospital,
  ambulancePos = null,
  pill = false,
  embedded = false,
  autoFocus = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(embedded);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

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

  const enrichedHospitals = useMemo(
    () => enrichHospitalsWithDistance(hospitals, ambulancePos),
    [hospitals, ambulancePos]
  );

  const filterCounts = useMemo(
    () => computeHospitalFilterCounts(enrichedHospitals),
    [enrichedHospitals]
  );

  const filteredHospitals = useMemo(
    () => filterAndSortHospitals(enrichedHospitals, query, activeFilter, selectedHospitalId),
    [enrichedHospitals, query, activeFilter, selectedHospitalId]
  );

  const handleSelect = (hospitalId) => {
    onSelectHospital?.(hospitalId);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    onSelectHospital?.(null);
    setQuery('');
  };

  const totalHospitals = hospitals.length || enrichedHospitals.length || 35000;
  const showList = embedded || isOpen;
  const hasAmbulancePos = ambulancePos?.lat != null && ambulancePos?.lon != null;
  const inputRightPadding = selectedHospitalId ? 'pr-44' : query ? 'pr-32' : 'pr-28';

  return (
    <div
      ref={containerRef}
      className={`${embedded ? 'flex flex-col h-full min-h-0' : 'relative'} font-mono ${className}`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isOpen) setIsOpen(true);
        }}
        className="relative flex items-center shrink-0"
      >
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
          <Search className="w-4 h-4" />
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
          placeholder={pill ? `Search ${totalHospitals} hospitals, states, incidents…` : 'Search hospitals by name, city, or state'}
          className={`w-full pl-10 ${inputRightPadding} ${
            pill
              ? 'py-2.5 rounded-full bg-white/95 dark:bg-slate-900/95 shadow-xl border-slate-200/90 dark:border-white/[0.12]'
              : 'py-2 sm:py-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/90 shadow-xs border-slate-200/90 dark:border-white/[0.08]'
          } border text-xs sm:text-sm font-sans transition-all backdrop-blur-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20 dark:focus:ring-white/10`}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear search text"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {selectedHospitalId && !query && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer"
              title="Reset manual destination override back to automated CAD recommendation"
            >
              Auto CAD
            </button>
          )}

          <button
            type="submit"
            onClick={() => {
              if (!isOpen) setIsOpen(true);
              inputRef.current?.focus();
            }}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-sans font-bold bg-[#1F3C6D] dark:bg-red-600 text-white hover:bg-blue-800 dark:hover:bg-red-700 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            title="Search hospitals"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Search</span>
          </button>
        </div>
      </form>

      {showList && (
        <div
          className={
            embedded
              ? 'relative w-full flex-1 min-h-0 mt-1.5 sm:mt-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col page-enter'
              : 'absolute left-0 right-0 top-full mt-2 z-[800] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[75vh] flex flex-col page-enter'
          }
        >
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
              <>
                {filteredHospitals.slice(0, 60).map((hosp) => (
                  <HospitalSearchResultItem
                    key={hosp.id}
                    hosp={hosp}
                    isSelected={hosp.id === selectedHospitalId}
                    isCadBest={Boolean(activeHospital && hosp.id === activeHospital.id && !selectedHospitalId)}
                    onSelect={handleSelect}
                  />
                ))}
                {filteredHospitals.length > 60 && (
                  <div className="p-2.5 text-center text-[11px] font-sans text-slate-500 dark:text-slate-400">
                    Showing top 60 nearest of {filteredHospitals.length} matching hospitals — type a name, city, or state to narrow down.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HospitalSearchBar;
