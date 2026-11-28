import { Bed, Check, ChevronRight, MapPin, Navigation, Phone, Sparkles } from 'lucide-react';
import { HospitalBrandLogo } from '../ui/BrandLogos.jsx';
import { formatDistance } from '../../utils/geo.js';

export function HospitalSearchResultItem({
  hosp,
  isSelected,
  isCadBest,
  onSelect,
}) {
  const beds = hosp.bedAvailability || {};
  const isTrauma = hosp.specialties?.includes('trauma_center');
  const isCardiac = hosp.specialties?.includes('cardiology');
  const isBurn = hosp.specialties?.includes('burn_unit');

  return (
    <div
      onClick={() => onSelect(hosp.id)}
      className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
        isSelected
          ? 'bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-950/40 dark:border-emerald-500/30 shadow-xs'
          : isCadBest
          ? 'bg-blue-500/10 border-blue-500/30 dark:bg-blue-950/30 dark:border-blue-500/20'
          : 'bg-white/60 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-800/80'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <HospitalBrandLogo hospitalName={hosp.name} className="w-8 h-8 rounded-lg shrink-0 mt-0.5 shadow-xs" />
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

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans line-clamp-1">
            {hosp.address}
          </p>
        </div>

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

      <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(hosp.id);
            }}
            className={`flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold font-sans cursor-pointer transition-all shadow-2xs active:scale-95 ${
              isSelected
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#1F3C6D] hover:bg-[#152a4d] text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{isSelected ? 'Route Active' : 'Directions / Route'}</span>
          </button>

          {(hosp.phone || hosp.alternatePhone) && (
            <a
              href={`tel:${(hosp.phone || hosp.alternatePhone).replace(/[^0-9+]/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-medium font-sans border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-2xs"
              title={`Call hospital emergency desk: ${hosp.phone || hosp.alternatePhone}`}
            >
              <Phone className="w-3.5 h-3.5 text-[#D62828]" />
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
}

export default HospitalSearchResultItem;
