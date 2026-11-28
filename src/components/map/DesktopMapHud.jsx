import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bed,
  Bell,
  ChevronRight,
  LayoutGrid,
  Locate,
  Lock,
  PhoneCall,
  Plus,
  SlidersHorizontal,
  Unlock,
  X,
} from 'lucide-react';
import HospitalSearchBar from './HospitalSearchBar.jsx';
import { LayersThumbnail } from './MapLayersControl.jsx';
import DesktopInspectorDrawer from './DesktopInspectorDrawer.jsx';
import { HospitalBrandLogo } from '../ui/BrandLogos.jsx';
import { EMERGENCY_CATEGORIES } from '../../config/emergencyCategories.js';
import { DEFAULT_AMBULANCE_ORIGIN } from '../../config/constants.js';
import { formatDistance } from '../../utils/geo.js';
import { formatDuration, formatEtaShort } from '../../utils/time.js';

export function DesktopMapHud({
  graph,
  routing,
  live,
  dispatchIncidents,
  focusIncidentOnMap,
  canDragAmbulance,
  setCanDragAmbulance,
  mapStyle,
  setMapStyle,
  isDark,
  showGraphNetwork,
  setShowGraphNetwork,
  activeDistance,
  activeDuration,
  onOpenBedManager,
  onOpenNewEmergency,
  onOpenHelp,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [placeCardOpen, setPlaceCardOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const {
    ambulancePos,
    snappedSourceNode,
    emergencyCategory,
    setEmergencyCategory,
    selectedHospitalId,
    setSelectedHospitalId,
    isHospitalLocked,
    toggleHospitalLock,
    activeHospital,
    availableHospitals,
    searchHospitals,
  } = routing;

  const openEmergencies = dispatchIncidents.filter((i) => i.status !== 'RESOLVED');
  const roadAlertCount = graph.incidents instanceof Map ? graph.incidents.size : 0;
  const totalNotifications = openEmergencies.length + roadAlertCount;

  return (
    <>
      <div className="absolute top-3.5 left-4 right-4 z-[600] flex items-start justify-between gap-3 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="pointer-events-auto w-full sm:w-[350px] xl:w-[380px] shrink-0">
            <HospitalSearchBar
              pill
              hospitals={searchHospitals && searchHospitals.length > 0 ? searchHospitals : availableHospitals}
              selectedHospitalId={selectedHospitalId}
              activeHospital={activeHospital}
              onSelectHospital={setSelectedHospitalId}
              ambulancePos={ambulancePos}
            />
          </div>

          <div className="pointer-events-auto hidden md:flex items-center gap-1.5 flex-wrap">
            {Object.values(EMERGENCY_CATEGORIES).map((cat) => {
              const active = emergencyCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setEmergencyCategory(cat.id)}
                  className={`h-9 px-3.5 rounded-full border text-xs font-sans font-semibold shadow-md backdrop-blur-xl transition-all cursor-pointer active:scale-95 ${
                    active
                      ? 'text-white border-transparent shadow-lg'
                      : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  style={active ? { backgroundColor: cat.color } : undefined}
                >
                  {cat.shortLabel}
                </button>
              );
            })}

            {onOpenNewEmergency && (
              <button
                type="button"
                onClick={onOpenNewEmergency}
                className="h-9 px-3.5 rounded-full bg-[#D62828] hover:bg-red-700 text-white text-xs font-sans font-bold inline-flex items-center gap-1.5 shadow-lg cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Emergency</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenBedManager}
              className="h-9 px-3.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-sans font-semibold inline-flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <Bed className="w-3.5 h-3.5 text-[#D62828] dark:text-red-400" />
              <span>Beds</span>
            </button>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => (live.isGpsActive ? live.stopGps() : live.startGps())}
            className={`h-9 px-3.5 rounded-full border text-xs font-sans font-bold inline-flex items-center gap-1.5 shadow-md backdrop-blur-xl cursor-pointer transition-all ${
              live.isGpsActive
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-white/[0.1] text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Locate className={`w-3.5 h-3.5 ${live.isGpsActive ? 'text-white' : 'text-[#D62828]'}`} />
            <span>{live.isGpsActive ? 'GPS Live' : 'Activate GPS'}</span>
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            className={`h-9 px-3.5 rounded-full border text-xs font-sans font-semibold inline-flex items-center gap-1.5 shadow-md backdrop-blur-xl cursor-pointer transition-all ${
              drawerOpen
                ? 'bg-[#D62828] border-[#D62828] text-white'
                : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-white/[0.1] text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle Corridor Inspector (Alerts, Hospitals, Telemetry)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Inspector</span>
            {roadAlertCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-mono font-bold">
                {roadAlertCount}
              </span>
            )}
          </button>

          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="relative w-9 h-9 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-md flex items-center justify-center cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#D62828] text-white text-[9px] font-mono font-bold flex items-center justify-center tabular-nums">
                  {totalNotifications}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.1] shadow-2xl overflow-hidden z-[750]">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider font-mono text-slate-900 dark:text-slate-100">
                    Active Queue ({totalNotifications})
                  </span>
                  <Link to="/incidents" onClick={() => setNotifOpen(false)} className="text-[#D62828] font-semibold no-underline hover:underline">
                    View Queue
                  </Link>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {openEmergencies.map((inc) => (
                    <button
                      key={inc.id}
                      type="button"
                      onClick={() => {
                        focusIncidentOnMap(inc);
                        setNotifOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-[#D62828]">{inc.id} · {inc.severity}</span>
                        <span className="text-slate-500">{inc.assignedUnitId || 'Unassigned'}</span>
                      </div>
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate mt-0.5">{inc.locationName}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenHelp}
            className="w-9 h-9 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-md flex items-center justify-center cursor-pointer"
            title="CAD Map Help & Tools"
            aria-label="CAD Map Guide"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-5 left-4 z-[600] pointer-events-none">
        <LayersThumbnail
          mapStyle={mapStyle}
          onChangeMapStyle={setMapStyle}
          showGraphNetwork={showGraphNetwork}
          onToggleGraphNetwork={() => setShowGraphNetwork((v) => !v)}
          onOpenLegend={onOpenHelp}
          isDark={isDark}
        />
      </div>

      {activeHospital && (
        <div className="absolute top-[64px] left-4 z-[590] pointer-events-none">
          {placeCardOpen ? (
            <div className="pointer-events-auto w-[350px] xl:w-[380px] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.1] shadow-2xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-start justify-between gap-2.5">
                <HospitalBrandLogo hospitalName={activeHospital.name} className="w-9 h-9 rounded-xl shrink-0 shadow-xs mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase">
                      {isHospitalLocked ? 'Locked' : selectedHospitalId ? 'Selected' : 'Recommended'}
                    </span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {activeDuration > 0 ? formatDuration(activeDuration) : '--'} · {activeDistance > 0 ? formatDistance(activeDistance) : '--'}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-1">
                    {activeHospital.name}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {activeHospital.bedAvailability?.icuBedsFree ?? 0} ICU · {activeHospital.bedAvailability?.traumaBedsFree ?? 0} Trauma · Origin: {snappedSourceNode?.name || DEFAULT_AMBULANCE_ORIGIN.shortName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPlaceCardOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  aria-label="Minimize destination card"
                  title="Minimize card"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {activeHospital.phone && (
                  <a
                    href={`tel:${activeHospital.phone.replace(/[^0-9+]/g, '')}`}
                    className="flex-1 h-8 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold inline-flex items-center justify-center gap-1.5 no-underline transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={toggleHospitalLock}
                  aria-pressed={isHospitalLocked}
                  className={`h-8 px-2.5 rounded-xl border font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                    isHospitalLocked
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300'
                      : 'border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {isHospitalLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{isHospitalLocked ? 'Locked' : 'Lock'}</span>
                </button>
                <Link
                  to="/routing"
                  className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold inline-flex items-center gap-1 no-underline transition-colors"
                >
                  <span>Routes</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPlaceCardOpen(true)}
              className="pointer-events-auto h-10 px-4 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-xl text-xs font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="max-w-[200px] truncate">{activeHospital.shortName || activeHospital.name}</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {formatEtaShort(activeDuration || activeHospital.travelTimeSec)}
              </span>
            </button>
          )}
        </div>
      )}

      {drawerOpen && (
        <DesktopInspectorDrawer
          onClose={() => setDrawerOpen(false)}
          graph={graph}
          routing={routing}
          live={live}
          canDragAmbulance={canDragAmbulance}
          setCanDragAmbulance={setCanDragAmbulance}
        />
      )}
    </>
  );
}

export default DesktopMapHud;
