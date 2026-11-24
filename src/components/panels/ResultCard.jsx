/**
 * 21st.dev style Result Card: Emergency Patient Transport & Triage Manifest.
 * Renders primary facility recommendation, ETA countdown window, bed capacity telemetry, and contingency alternates.
 */

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Hospital,
  Clock,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Bed,
  Navigation,
  ShieldCheck,
  Phone,
  PhoneCall,
  Sparkles,
  Search,
  X,
} from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import HospitalSearchBar from '../map/HospitalSearchBar.jsx';
import { formatDistance } from '../../utils/geo.js';
import { formatDuration } from '../../utils/time.js';
import { WarningsList } from './WarningsList.jsx';
import { DataFreshness } from './DataFreshness.jsx';

export function ResultCard({
  hospital,
  alternateHospitals = [],
  searchHospitals = [],
  selectedHospitalId,
  onSelectHospital,
  sourceNode,
  algorithm,
  isFigure2Mode,
  wibApiStatus,
  onRefreshWib,
  isSyncingWib,
  onOpenBedManager,
}) {
  const navigate = useNavigate();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [inlineQuery, setInlineQuery] = useState('');

  // Lock body scrolling when search modal is open
  useEffect(() => {
    if (!searchModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [searchModalOpen]);

  // Close search modal on Escape key
  useEffect(() => {
    if (!searchModalOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setSearchModalOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen]);

  const trimmedQuery = inlineQuery.trim();
  const isSearching = trimmedQuery.length > 0;
  const searchablePool = searchHospitals && searchHospitals.length > 0 ? searchHospitals : alternateHospitals;

  // Multi-token filter across name, city, address, and medical specialties (within 100km)
  const searchedHospitals = useMemo(() => {
    if (!trimmedQuery) return [];
    const tokens = trimmedQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return searchablePool.filter((alt) => {
      const searchTarget = `${alt.name || ''} ${alt.city || ''} ${alt.address || ''} ${alt.specialties?.join(' ') || ''}`.toLowerCase();
      return tokens.every((token) => searchTarget.includes(token));
    });
  }, [searchablePool, trimmedQuery]);
  if (!hospital) {
    return (
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] p-6 text-center space-y-3 transition-colors shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center border border-amber-500/20">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-sans">
          No Reachable Medical Facility
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-sans">
          No hospital meeting the requested specialty constraint is reachable from the current coordinate.
          Verify road closures or adjust the emergency triage category.
        </p>
      </div>
    );
  }

  const isFigure2 = Boolean(isFigure2Mode);
  const etaText = isFigure2
    ? `${hospital.travelTimeSec || 9} min`
    : formatDuration(hospital.travelTimeSec);

  const icuCount = hospital.bedAvailability?.icuBedsFree ?? 0;
  const wardCount = hospital.bedAvailability?.emergencyWardFree ?? 0;
  const traumaCount = hospital.bedAvailability?.traumaBedsFree ?? 0;

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] p-4 sm:p-5 space-y-4 transition-colors @container">
      {/* Manifest Header: Primary Recommendation */}
      <div className="flex flex-col @2xl:flex-row @2xl:items-start justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-4">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-xl bg-red-500/10 text-[#D62828] dark:text-red-400 shrink-0 mt-0.5 border border-red-500/25 shadow-xs">
              <Hospital className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={hospital.isManualOverride ? 'warning' : 'destructive'}>
                  {hospital.isManualOverride ? 'Manual Destination Override' : 'Optimal Receiving Hospital'}
                </Badge>
                {selectedHospitalId && onSelectHospital && (
                  <button
                    type="button"
                    onClick={() => onSelectHospital(null)}
                    className="text-[10px] font-mono text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline cursor-pointer"
                  >
                    ↺ Reset to Best Match
                  </button>
                )}
                {hospital.nabhAccredited && (
                  <Badge variant="success">NABH ACCREDITED</Badge>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight mt-1 truncate font-sans">
                {hospital.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                {hospital.address || 'Greater Noida Road Network Node'}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                {hospital.phone && (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    href={`tel:${hospital.phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold transition-all shadow-sm cursor-pointer no-underline max-w-full truncate"
                    title={`Call ${hospital.name} emergency desk to confirm seat/bed occupancy (${hospital.phone})`}
                  >
                    <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Call: {hospital.phone}</span>
                  </motion.a>
                )}
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  href="tel:108"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold transition-all border border-slate-200 dark:border-white/[0.08] cursor-pointer no-underline"
                  title="24/7 Government Emergency Ambulance Dispatch (Toll-Free 108)"
                >
                  <Phone className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                  <span>Ambulance: 108</span>
                </motion.a>
              </div>
            </div>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.06]">
              Capacity: {hospital.totalBeds || 150} beds · {hospital.institutionType || 'Multi-Specialty'}
            </span>
            {onOpenBedManager && (
              <button
                type="button"
                onClick={onOpenBedManager}
                className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer min-h-[28px]"
                title="Edit ICU, trauma, and emergency ward capacity"
              >
                <Bed className="w-3 h-3 text-[#D62828]" />
                <span>Edit Capacity</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary ETA Readout Window */}
        <div className="text-left @2xl:text-right @2xl:shrink-0 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/90 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 @2xl:justify-end">
            <Clock className="w-3 h-3 text-[#D62828]" />
            Predicted En-Route ETA
          </span>
          <div className="text-2xl @2xl:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono leading-none my-1 tracking-tight tabular-nums">
            {etaText}
          </div>
          <Badge variant="success" size="sm">CALIBRATED DYNAMIC ETA</Badge>
        </div>
      </div>

      {/* Bed Availability Telemetry Matrix */}
      <div className="bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-3.5 flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs ${
              icuCount > 0 ? 'bg-emerald-600' : 'bg-amber-600'
            }`}
          >
            <Bed className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 font-sans">
                Facility Triage Capacity Status
              </span>
              <Badge variant={icuCount > 0 ? 'success' : 'warning'} size="sm">
                {hospital.bedAvailability?.status || 'AVAILABLE'}
              </Badge>
              {hospital.seatReadinessLabel && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    hospital.seatReadinessLevel === 'OPTIMAL'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : hospital.seatReadinessLevel === 'CRITICAL'
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  }`}
                >
                  {hospital.seatReadinessLabel}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Live capacity telemetry · Confirm with receiving desk during transport
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center @2xl:shrink-0 @2xl:min-w-[15rem]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-2 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">ICU Free</span>
            <span
              className={`text-sm font-bold font-mono tabular-nums ${
                icuCount > 0 ? 'text-[#16A34A] dark:text-emerald-400' : 'text-[#D62828] dark:text-red-400'
              }`}
            >
              {icuCount}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-2 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">Ward Free</span>
            <span className="text-sm font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
              {wardCount}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-2 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">Trauma Bay</span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {traumaCount}
            </span>
          </div>
        </div>
      </div>

      {/* Route & Computational Telemetry Strip */}
      <div className="grid grid-cols-2 @2xl:grid-cols-4 gap-2.5 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-3.5 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Corridor Length</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs tabular-nums">
            {isFigure2 ? 'N/A (Schematic)' : hospital.roadDistanceKm ? `${hospital.roadDistanceKm} km road` : formatDistance(hospital.distanceM)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Snapped Origin</span>
          <span
            className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate block"
            title={sourceNode?.name}
          >
            {sourceNode?.name || 'Nearest node'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Graph Engine</span>
          <span className="font-medium text-slate-800 dark:text-slate-200 text-xs uppercase">
            {algorithm === 'compare' ? 'A* / Dijkstra Dual' : `${algorithm} Router`}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Compute Latency</span>
          <span className="font-medium text-slate-800 dark:text-slate-200 text-xs tabular-nums">
            {hospital.nodesExpanded} nodes · {hospital.queryTimeMs} ms
          </span>
        </div>
      </div>

      {/* Alternate Contingency Facilities */}
      {alternateHospitals.length > 0 && (
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
            {/* Quick Search Button */}
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

          {/* Inline Search Input (Clean 21st.dev Normal Style) */}
          <div className="relative flex items-center mb-3">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inlineQuery}
              onChange={(e) => setInlineQuery(e.target.value)}
              placeholder={`Search ${searchablePool.length} contingency facilities within 100 km by name, specialty, or city...`}
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

          {/* Facilities list: ONLY rendered when searched! */}
          {!isSearching ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200/90 dark:border-white/[0.08] bg-slate-50/50 dark:bg-slate-950/30 text-center space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-[#D62828] dark:text-red-400 mx-auto flex items-center justify-center border border-red-500/20">
                <Hospital className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-sans">
                  {searchablePool.length} Contingency Facilities Available (100 km)
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
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block truncate leading-tight font-sans">
                          {alt.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 block">
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

          {/* Contingency Hospital Search Modal Overlay (Fixed Fullscreen Overlay) */}
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
                      <span className="truncate">Contingency Search ({searchablePool.length} within 100 km)</span>
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
      )}

      {/* Warnings & Data Limitations */}
      <WarningsList warnings={hospital.warnings} />
      <DataFreshness
        hospital={hospital}
        wibApiStatus={wibApiStatus}
        onRefreshWib={onRefreshWib}
        isSyncingWib={isSyncingWib}
      />
    </div>
  );
}

export default ResultCard;
