import { Lock, MapPin, PhoneCall, Unlock } from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';
import { HospitalBrandLogo } from '../ui/BrandLogos.jsx';
import { formatDistance } from '../../utils/geo.js';
import { formatDuration } from '../../utils/time.js';

export function HospitalDirectoryCard({
  hosp,
  isSelected,
  isHospitalLocked,
  onSelectAndRoute,
  onToggleLock,
}) {
  const icuFree = hosp.bedAvailability?.icuBedsFree ?? 0;
  const traumaFree = hosp.bedAvailability?.traumaBedsFree ?? 0;
  const wardFree = hosp.bedAvailability?.emergencyWardFree ?? 0;

  return (
    <div
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

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs">
        <button
          type="button"
          onClick={() => onSelectAndRoute(hosp.id)}
          className="flex-1 h-8 rounded-xl bg-[#D62828] hover:bg-red-700 text-white font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Route &amp; Map</span>
        </button>

        {onToggleLock && isSelected && (
          <button
            type="button"
            onClick={onToggleLock}
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
}

export default HospitalDirectoryCard;
