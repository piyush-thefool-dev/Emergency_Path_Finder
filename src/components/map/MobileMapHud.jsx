import {
  Activity,
  AlertTriangle,
  HelpCircle,
  Layers,
  LayoutGrid,
  Lock,
  MapPin,
  Menu,
  Navigation2,
  Phone,
  Search,
  Unlock,
} from 'lucide-react';
import { LayersThumbnail } from './MapLayersControl.jsx';
import { STATE_STYLE } from '../panels/ApiStatusPanel.jsx';
import { EMERGENCY_CATEGORIES } from '../../config/emergencyCategories.js';
import { formatDistance } from '../../utils/geo.js';
import { formatEtaShort } from '../../utils/time.js';

export function MobileMapHud({
  routing,
  live,
  apiHealth,
  mapStyle,
  setMapStyle,
  isDark,
  showGraphNetwork,
  setShowGraphNetwork,
  isNetOffline,
  openDispatchIncidentCount,
  panel,
  setPanel,
  setDrawerOpen,
  setSearchModalOpen,
  setTrafficOpen,
  onOpenHelp,
  onNavigate,
  activeDistance,
  activeDuration,
}) {
  const {
    emergencyCategory,
    setEmergencyCategory,
    activeHospital,
    availableHospitals,
  } = routing;

  const speed = Math.max(0, Math.round(live.gpsSpeedKph ?? 0));
  const category = EMERGENCY_CATEGORIES[emergencyCategory];
  const overallHealth = apiHealth.summary.overall === 'ok' ? 'ok' : apiHealth.summary.overall;

  const handleGpsToggle = () => {
    if (live.isGpsActive) live.stopGps();
    else live.startGps();
  };

  return (
    <>
      <div className="absolute top-2 inset-x-0 z-[500] pointer-events-none pt-safe px-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="pointer-events-auto flex-1 min-w-0 h-11 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-lg px-1.5 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setPanel(null);
                setDrawerOpen(true);
              }}
              aria-label="Open dispatch operations menu"
              title="Open dispatch operations menu"
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0 transition-colors"
            >
              <Menu className="w-4 h-4" />
              {openDispatchIncidentCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#D62828] text-white text-[8px] font-mono font-bold flex items-center justify-center tabular-nums">
                  {openDispatchIncidentCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setTrafficOpen(false);
                setSearchModalOpen(true);
              }}
              aria-label="Search Registry"
              title={`Search all ${availableHospitals?.length || 35000} registered hospitals`}
              className="flex-1 min-w-0 h-full text-left px-1 text-xs sm:text-sm font-sans text-slate-500 dark:text-slate-300 truncate cursor-pointer"
            >
              Search {availableHospitals?.length || 35000} hospitals…
            </button>

            <button
              type="button"
              onClick={() => {
                setTrafficOpen(false);
                setSearchModalOpen(true);
              }}
              aria-label="Search hospitals"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/hospitals')}
              title="Open active route & receiving hospital details"
              aria-label="Open hospital details"
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-xs cursor-pointer shrink-0 active:scale-95 transition-transform ${
                activeHospital ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#D62828]'
              }`}
            >
              <Navigation2 className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

          <div className="pointer-events-auto relative shrink-0">
            <button
              type="button"
              onClick={() => setPanel((p) => (p ? null : 'tools'))}
              aria-label="Tools: Symbology, API, Guide"
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-xl cursor-pointer active:scale-95 transition-all ${
                panel !== null
                  ? 'bg-[#D62828] border-red-500 text-white'
                  : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-white/[0.1] text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <span
              aria-hidden="true"
              className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 ${
                STATE_STYLE[overallHealth].dot
              }`}
            />

            {panel === 'tools' && (
              <div className="absolute right-0 top-12 z-[600] w-56 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.1] shadow-2xl p-1.5 page-enter font-mono text-xs">
                {[
                  {
                    key: 'legend',
                    icon: <Layers className="w-4 h-4 text-[#D62828]" />,
                    text: 'Map Symbology',
                    onClick: () => setPanel('legend'),
                  },
                  {
                    key: 'api',
                    icon: <Activity className="w-4 h-4 text-sky-500" />,
                    text: 'Telemetry Feeds',
                    onClick: () => setPanel('api'),
                    badge: `${apiHealth.summary.ok}/${apiHealth.summary.total - apiHealth.summary.off}`,
                  },
                  {
                    key: 'help',
                    icon: <HelpCircle className="w-4 h-4 text-amber-500" />,
                    text: 'CAD Guide',
                    onClick: () => {
                      onOpenHelp();
                      setPanel(null);
                    },
                  },
                ].map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    onClick={row.onClick}
                    className="w-full min-h-[38px] px-2.5 rounded-xl flex items-center gap-2.5 font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left transition-colors"
                  >
                    <span className="w-4 flex justify-center shrink-0">{row.icon}</span>
                    <span className="flex-1 truncate">{row.text}</span>
                    {row.badge && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {row.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pointer-events-auto grid grid-cols-4 gap-1.5">
          {Object.values(EMERGENCY_CATEGORIES).map((c) => {
            const selected = c.id === emergencyCategory;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setEmergencyCategory(c.id)}
                title={`Route to a hospital with ${c.requiredSpecialty}`}
                className={`h-8 px-2 rounded-full text-xs font-sans font-semibold flex items-center justify-center truncate border shadow-md backdrop-blur-xl cursor-pointer active:scale-95 transition-all ${
                  selected
                    ? 'text-white border-transparent'
                    : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-white/[0.1]'
                }`}
                style={selected ? { backgroundColor: c.color } : undefined}
                aria-pressed={selected}
              >
                {c.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="pointer-events-none flex items-center">
          <button
            type="button"
            onClick={handleGpsToggle}
            aria-pressed={live.isGpsActive}
            className={`pointer-events-auto shrink-0 h-8 px-3 rounded-full text-xs font-sans font-bold flex items-center gap-1.5 border shadow-md backdrop-blur-xl cursor-pointer active:scale-95 transition-all ${
              live.isGpsActive
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-[#D62828] border-red-600 text-white'
            }`}
          >
            {live.isGpsActive ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>GPS Live</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5" />
                <span>Activate GPS</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className="absolute left-3 z-[500] flex items-end gap-2 pointer-events-none"
        style={{ bottom: '5.25rem' }}
      >
        <LayersThumbnail
          mapStyle={mapStyle}
          onChangeMapStyle={setMapStyle}
          showGraphNetwork={showGraphNetwork}
          onToggleGraphNetwork={() => setShowGraphNetwork((v) => !v)}
          onOpenLegend={() => setPanel('legend')}
          isDark={isDark}
          sizeClass="w-14 h-14"
        />

        <div
          role="status"
          aria-label={`Current speed ${speed} km/h`}
          className={`h-10 px-2.5 rounded-xl flex flex-col items-center justify-center shadow-lg border backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 pointer-events-auto ${
            live.isMoving ? 'border-emerald-500' : 'border-slate-200/90 dark:border-white/[0.1]'
          }`}
        >
          <span className="text-sm font-black font-mono leading-none text-slate-900 dark:text-slate-50 tabular-nums">
            {speed} <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">KM/H</span>
          </span>
        </div>
      </div>

      <div className="absolute inset-x-2.5 z-[500] pointer-events-none" style={{ bottom: '1.35rem' }}>
        <button
          type="button"
          onClick={() => onNavigate('/hospitals')}
          title="Open hospital details, ETA and alternatives"
          className="pointer-events-auto w-full text-left flex items-center gap-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-xl px-3 py-2 cursor-pointer active:scale-[0.99] transition-transform"
          aria-label="Open hospital details"
        >
          <span
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
              activeHospital ? 'bg-emerald-600' : 'bg-amber-500'
            }`}
          >
            {activeHospital ? <Navigation2 className="w-3.5 h-3.5 fill-current" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="truncate">
                {activeHospital
                  ? routing.isHospitalLocked
                    ? `Locked · ${category?.shortLabel || ''}`
                    : routing.selectedHospitalId
                    ? `Selected · ${category?.shortLabel || ''}`
                    : `Closest · ${category?.shortLabel || ''}`
                  : 'No hospital reachable'}
              </span>
              {isNetOffline && (
                <span className="px-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[9px]">Offline</span>
              )}
            </span>
            <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
              {activeHospital ? activeHospital.shortName || activeHospital.name : 'Select another category'}
            </span>
          </span>

          {activeHospital && (
            <span className="text-right shrink-0">
              <span className="block text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none tabular-nums">
                {formatEtaShort(activeDuration || activeHospital.travelTimeSec)}
              </span>
              <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                {formatDistance(activeDistance)}
              </span>
            </span>
          )}

          {activeHospital && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                routing.toggleHospitalLock();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  routing.toggleHospitalLock();
                }
              }}
              aria-pressed={routing.isHospitalLocked}
              className={`p-1.5 rounded-lg border shrink-0 cursor-pointer ${
                routing.isHospitalLocked
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
              }`}
              title={routing.isHospitalLocked ? 'Unlock hospital choice' : 'Lock hospital choice'}
            >
              {routing.isHospitalLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </span>
          )}

          <a
            href={`tel:${(activeHospital?.phone || '108').replace(/[^0-9+]/g, '')}`}
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 no-underline"
            title={activeHospital?.phone ? `Call ${activeHospital.phone}` : 'Call 108'}
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        </button>
      </div>
    </>
  );
}

export default MobileMapHud;
