/**
 * Hospital Reference & Bed Estimate Capacity Registry.
 * High-density operational hospital registry and triage capacity manager.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Hospital,
  Bed,
  CheckCircle2,
  RotateCcw,
  Plus,
  Minus,
  Save,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { getSearchRelevance } from '../../utils/hospitalSearch.js';

export function HospitalBedManagerModal({
  isOpen,
  asPage = false,
  onClose,
  hospitals = [],
  onSaveHospitals,
  onResetToDefaults,
}) {
  const [editedList, setEditedList] = useState(() => {
    return (hospitals || []).map((h) => ({
      ...h,
      bedAvailability: {
        ...h.bedAvailability,
        icuBedsFree: h.bedAvailability?.icuBedsFree ?? 4,
        traumaBedsFree: h.bedAvailability?.traumaBedsFree ?? 2,
        emergencyWardFree: h.bedAvailability?.emergencyWardFree ?? 12,
        status: h.bedAvailability?.status || 'AVAILABLE',
      },
    }));
  });

  const [savedNotice, setSavedNotice] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    setEditedList((hospitals || []).map((h) => ({
      ...h,
      bedAvailability: {
        ...h.bedAvailability,
        icuBedsFree: h.bedAvailability?.icuBedsFree ?? 4,
        traumaBedsFree: h.bedAvailability?.traumaBedsFree ?? 2,
        emergencyWardFree: h.bedAvailability?.emergencyWardFree ?? 12,
        status: h.bedAvailability?.status || 'AVAILABLE',
      },
    })));
    setSavedNotice(false);
    if (asPage) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, asPage]);

  if (!isOpen) return null;

  const updateField = (index, field, value) => {
    setEditedList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const updateBedField = (index, bedField, value) => {
    setEditedList((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      const currentBeds = { ...target.bedAvailability };
      currentBeds[bedField] = Math.max(0, parseInt(value, 10) || 0);

      if (bedField === 'icuBedsFree') {
        if (currentBeds.icuBedsFree === 0 && currentBeds.traumaBedsFree === 0) {
          currentBeds.status = 'FULL';
        } else if (currentBeds.icuBedsFree <= 1) {
          currentBeds.status = 'CRITICAL';
        } else if (currentBeds.icuBedsFree <= 3) {
          currentBeds.status = 'LIMITED';
        } else {
          currentBeds.status = 'AVAILABLE';
        }
      }

      target.bedAvailability = currentBeds;
      copy[index] = target;
      return copy;
    });
  };

  const toggleSpecialty = (index, spec) => {
    setEditedList((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      const specs = new Set(target.specialties || []);
      if (specs.has(spec)) {
        if (specs.size > 1) specs.delete(spec);
      } else {
        specs.add(spec);
      }
      target.specialties = Array.from(specs);
      copy[index] = target;
      return copy;
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (onSaveHospitals) {
      onSaveHospitals(editedList);
    }
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      if (!asPage) onClose?.();
    }, 1000);
  };

  const handleReset = () => {
    if (onResetToDefaults) {
      onResetToDefaults();
      if (!asPage) onClose?.();
    }
  };

  const modalContent = (
    <div
      className={
        asPage
          ? 'flex-1 min-h-0 flex flex-col w-full h-full overflow-hidden'
          : 'fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150'
      }
      role={asPage ? undefined : 'dialog'}
      aria-modal={asPage ? undefined : 'true'}
      aria-labelledby="hospital-bed-manager-title"
    >
      <div
        className={
          asPage
            ? 'flex-1 min-h-0 flex flex-col w-full h-full text-slate-800 dark:text-slate-100 overflow-hidden'
            : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-2xl max-w-3xl w-full max-h-[92dvh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-colors'
        }
      >
        {/* Header */}
        <div className={`${asPage ? 'hidden' : ''} bg-slate-900/90 dark:bg-slate-950/90 text-white p-4 flex items-center justify-between shrink-0 border-b border-slate-800 backdrop-blur-md`}>
          <div className="flex items-center gap-2.5 font-mono">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-[#D62828] to-rose-600 text-white shrink-0 shadow-xs border border-red-400/40">
              <Hospital className="w-4 h-4" />
            </span>
            <div>
              <h3 id="hospital-bed-manager-title" className="text-xs sm:text-sm font-bold tracking-tight">
                Hospital Reference Directory & Clinical Bed Telemetry
              </h3>
              <p className="text-[10px] text-slate-400">
                ICU, trauma, emergency capacity telemetry & triage filters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Reset Bar */}
        <div className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-white/[0.06] px-4 py-2.5 text-xs font-mono text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${editedList.length} hospitals by name or city...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-400/20 shadow-2xs transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-[#D62828] dark:text-red-400 font-bold flex items-center gap-1 hover:underline cursor-pointer shrink-0 self-end sm:self-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* Scrollable list & Sticky Actions */}
        <form onSubmit={handleSave} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 no-scrollbar overscroll-contain">
          {editedList
            .map((hosp, idx) => ({ hosp, idx, rel: getSearchRelevance(hosp, searchTerm) }))
            .filter(({ rel }) => rel > 0)
            .sort((a, b) => {
              if (searchTerm.trim() && b.rel !== a.rel) {
                return b.rel - a.rel;
              }
              return 0;
            })
            .map(({ hosp, idx }) => {
            const beds = hosp.bedAvailability || {};

            return (
              <div
                key={hosp.id || idx}
                className="bg-white dark:bg-slate-900/70 rounded-lg border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-3 font-mono"
              >
                {/* Hospital Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <input
                        type="text"
                        aria-label={`Hospital name for entry ${idx + 1}`}
                        value={hosp.name}
                        onChange={(e) => updateField(idx, 'name', e.target.value)}
                        className="font-bold text-xs text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-red-500 focus:outline-hidden px-1 py-0.5 rounded w-full"
                      />
                      <p className="text-[10px] text-slate-400 px-1 truncate">
                        {hosp.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Status:</label>
                    <select
                      aria-label={`Bed capacity status for ${hosp.name}`}
                      value={beds.status}
                      onChange={(e) => {
                        const copy = [...editedList];
                        copy[idx].bedAvailability.status = e.target.value;
                        setEditedList(copy);
                      }}
                      className="text-xs font-bold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="LIMITED">LIMITED</option>
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="FULL">FULL / NO BEDS</option>
                    </select>
                  </div>
                </div>

                {/* Bed Steppers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {/* ICU */}
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-red-950 dark:text-red-300 block text-[10px] uppercase">
                        ICU Free
                      </span>
                      <span className="text-[10px] text-slate-400">Critical Care</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateBedField(idx, 'icuBedsFree', (beds.icuBedsFree || 0) - 1)}
                        className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 text-red-700 dark:text-red-300 flex items-center justify-center font-bold cursor-pointer"
                        aria-label="Decrease ICU beds"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs tabular-nums text-red-700 dark:text-red-300">
                        {beds.icuBedsFree ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateBedField(idx, 'icuBedsFree', (beds.icuBedsFree || 0) + 1)}
                        className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 text-red-700 dark:text-red-300 flex items-center justify-center font-bold cursor-pointer"
                        aria-label="Increase ICU beds"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Trauma */}
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-amber-950 dark:text-amber-300 block text-[10px] uppercase">
                        Trauma Bay
                      </span>
                      <span className="text-[10px] text-slate-400">Resuscitation</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateBedField(idx, 'traumaBedsFree', (beds.traumaBedsFree || 0) - 1)}
                        className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold cursor-pointer"
                        aria-label="Decrease Trauma beds"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs tabular-nums text-amber-700 dark:text-amber-300">
                        {beds.traumaBedsFree ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateBedField(idx, 'traumaBedsFree', (beds.traumaBedsFree || 0) + 1)}
                        className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold cursor-pointer"
                        aria-label="Increase Trauma beds"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* ER Ward */}
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-950 dark:text-emerald-300 block text-[10px] uppercase">
                        ER Ward
                      </span>
                      <span className="text-[10px] text-slate-400">General Beds</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateBedField(idx, 'emergencyWardFree', (beds.emergencyWardFree || 0) - 1)}
                        className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold cursor-pointer"
                        aria-label="Decrease ER beds"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs tabular-nums text-emerald-700 dark:text-emerald-300">
                        {beds.emergencyWardFree ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateBedField(idx, 'emergencyWardFree', (beds.emergencyWardFree || 0) + 1)}
                        className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold cursor-pointer"
                        aria-label="Increase ER beds"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 mr-1">Specialties:</span>
                  {[
                    { id: 'trauma_center', label: 'Trauma Center' },
                    { id: 'cardiology', label: 'Cath Lab / Cardiac' },
                    { id: 'burn_unit', label: 'Burn Unit' },
                    { id: 'general_emergency', label: '24/7 Emergency' },
                  ].map((s) => {
                    const hasSpec = hosp.specialties?.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSpecialty(idx, s.id)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          hasSpec
                            ? 'bg-[#D62828] text-white border-[#D62828] font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </div>

          {/* Sticky Actions */}
          <div className="shrink-0 z-10 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/90 dark:border-white/[0.08] px-4 py-3 flex items-center justify-between gap-3 backdrop-blur-md shadow-md">
            {savedNotice ? (
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Hospital capacity parameters saved.</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                Greater Noida Network: Pari Chowk, Knowledge Park, Alpha, Delta & Surajpur.
              </span>
            )}

            <div className={`flex items-center gap-2 ${asPage ? 'flex-1 sm:flex-none sm:ml-auto' : 'ml-auto'}`}>
              {!asPage && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className={`px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${asPage ? 'flex-1 sm:flex-none' : ''}`}
              >
                <Save className="w-4 h-4" />
                <span>Save Parameters</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  if (!asPage && typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

export default HospitalBedManagerModal;
