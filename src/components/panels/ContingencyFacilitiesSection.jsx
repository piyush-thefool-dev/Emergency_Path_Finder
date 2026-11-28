import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Hospital, Search, X } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import HospitalSearchBar from '../map/HospitalSearchBar.jsx';
import { HospitalBrandLogo } from '../ui/BrandLogos.jsx';
import { formatDistance } from '../../utils/geo.js';
import { formatDuration } from '../../utils/time.js';

export function ContingencyFacilitiesSection({
  hospital,
  alternateHospitals = [],
  searchHospitals = [],
  selectedHospitalId,
  onSelectHospital,
  sourceNode,
}) {
  const navigate = useNavigate();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [inlineQuery, setInlineQuery] = useState('');

  useEffect(() => {
    if (!searchModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [searchModalOpen]);

  useEffect(() => {
    if (!searchModalOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSearchModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchModalOpen]);

  const trimmedQuery = inlineQuery.trim();
  const isSearching = trimmedQuery.length > 0;
  const searchablePool = searchHospitals && searchHospitals.length > 0 ? searchHospitals : alternateHospitals;

  const searchedHospitals = useMemo(() => {
    if (!trimmedQuery) return [];
    const tokens = trimmedQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return searchablePool.filter((alt) => {
      const searchTarget = `${alt.name || ''} ${alt.city || ''} ${alt.address || ''} ${alt.specialties?.join(' ') || ''}`.toLowerCase();
      return tokens.every((token) => searchTarget.includes(token));
    });
  }, [searchablePool, trimmedQuery]);

  if (alternateHospitals.length === 0 && searchablePool.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-slate-100 dark:border-white/[0.06] pt-3.5">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            Contingency Facilities ({alternateHospitals.length})
          </span>
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0.5 shrink-0 hidden sm:inline-flex">
            On-Demand
          </Badge>
        </div>
        <button
          type="button"
          onClick={() => setSearchModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#D62828] dark:text-red-400 font-mono text-xs font-bold border border-red-500/25 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
          title={`Search all ${alternateHospitals.length} contingency facilities`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search ({alternateHospitals.length})</span>
        </button>
      </div>

      <div className="relative flex items-center mb-3">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={inlineQuery}
          onChange={(e) => setInlineQuery(e.target.value)}
          placeholder={`Search ${searchablePool.length} registered facilities by name, specialty, or city...`}
          className="w-full text-xs font-sans pl-10 pr-24 py-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20 dark:focus:ring-white/10 transition-all shadow-2xs"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {inlineQuery ? (
            <button
              type="button"
              onClick={() => setInlineQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-200/50 dark:bg-slate-800/60 border border-slate-300/50 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Open full-screen registry modal"
            >
              Full Modal
            </button>
          )}
        </div>
      </div>

      {!isSearching ? (
        <div className="p-4 rounded-xl border border-dashed border-slate-200/90 dark:border-white/[0.08] bg-slate-50/50 dark:bg-slate-950/30 text-center space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 text-[#D62828] dark:text-red-400 mx-auto flex items-center justify-center border border-red-500/20">
            <Hospital className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-sans">
              {searchablePool.length} Registered Facilities Available
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5 max-w-sm mx-auto">
              Facility cards are hidden to keep your manifest clean. Type in the search bar above or click below to search and override route.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/[0.1] hover:border-red-500/40 text-slate-800 dark:text-slate-200 hover:text-[#D62828] dark:hover:text-red-400 font-mono text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 mx-auto"
          >
            <Search className="w-3.5 h-3.5 text-[#D62828]" />
            <span>Search All ({searchablePool.length}) Facilities</span>
          </button>
        </div>
      ) : searchedHospitals.length === 0 ? (
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/40 dark:bg-slate-950/20 text-center space-y-1.5">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            No contingency facilities matching &quot;{trimmedQuery}&quot;
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Try searching by specialty, city, or open the full search modal.
          </p>
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono text-[#D62828] dark:text-red-400 font-semibold hover:underline cursor-pointer mt-1"
          >
            <Search className="w-3 h-3" />
            <span>Open Search Modal</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 px-0.5">
            <span>
              Found {searchedHospitals.length} matching {searchedHospitals.length === 1 ? 'facility' : 'facilities'}:
            </span>
            <span className="text-[10px]">Select to override route</span>
          </div>
          <div className="grid grid-cols-1 @xl:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
            {searchedHospitals.map((alt) => {
              const isSelected = selectedHospitalId === alt.id;
              const deltaSec = (alt.travelTimeSec || 0) - (hospital.travelTimeSec || 0);
              const deltaMinutes = Math.round(deltaSec / 60);
              return (
                <motion.button
                  key={alt.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectHospital(alt.id)}
                  className={`text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer min-h-[48px] ${
                    isSelected
                      ? 'border-[#D62828] dark:border-red-500 bg-red-500/10 dark:bg-red-950/40 ring-1 ring-red-500 font-semibold shadow-xs'
                      : 'border-slate-200/80 dark:border-white/[0.06] bg-white/60 dark:bg-slate-900/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                    <HospitalBrandLogo hospitalName={alt.name} className="w-7 h-7 rounded-md shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block truncate leading-tight font-sans">
                        {alt.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 block truncate">
                        ETA: {alt.durationMin != null ? `${alt.durationMin} min` : formatDuration(alt.travelTimeSec)} · {alt.roadDistanceKm != null ? `${alt.roadDistanceKm} km road` : formatDistance(alt.distanceM)}
                        {deltaMinutes > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 ml-1 font-semibold">
                            (+{deltaMinutes} min)
                          </span>
                        )}
                        {alt.phone && (
                          <span className="text-slate-400 ml-1.5 font-sans">
                            · {alt.phone}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  {isSelected ? (
                    <span className="p-1.5 rounded-lg bg-[#D62828] text-white shrink-0 shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono font-semibold text-[#D62828] dark:text-red-400 shrink-0">
                      Route →
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {searchModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-start sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Search contingency hospitals"
        >
          <div className="bg-white dark:bg-slate-900 w-full h-full sm:h-[85dvh] sm:max-w-lg sm:rounded-2xl border-0 sm:border border-slate-200 dark:border-white/[0.08] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 sm:p-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between shrink-0 bg-slate-50/90 dark:bg-slate-950/90">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(false)}
                  className="p-1.5 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer sm:hidden"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 font-mono flex items-center gap-1.5 truncate">
                  <Hospital className="w-3.5 h-3.5 text-[#D62828] shrink-0" />
                  <span className="truncate">Registry Search ({searchablePool.length} Registered Facilities)</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 sm:p-4 flex-1 min-h-0 flex flex-col overflow-hidden">
              <HospitalSearchBar
                hospitals={searchablePool}
                selectedHospitalId={selectedHospitalId}
                activeHospital={hospital}
                onSelectHospital={(id) => {
                  onSelectHospital(id);
                  setSearchModalOpen(false);
                  navigate('/');
                }}
                ambulancePos={sourceNode}
                embedded={true}
                autoFocus={true}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default ContingencyFacilitiesSection;
