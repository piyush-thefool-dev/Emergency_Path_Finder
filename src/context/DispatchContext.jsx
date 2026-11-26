/**
 * Dispatch Context: Central Operational State shared across Phone UI & Web Command Console.
 * Connects graph/congestion (useGraph), hospital routing (useRouting), live GPS (useLiveLocation),
 * API telemetry (useApiHealth), and desktop emergency queue / fleet tracking.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useGraph } from '../hooks/useGraph.js';
import { useRouting } from '../hooks/useRouting.js';
import { useLiveLocation } from '../hooks/useLiveLocation.js';
import { useApiHealth } from '../hooks/useApiHealth.js';
import { useTheme } from './ThemeContext.jsx';
import { shouldSwitchHospitalForRoute } from '../services/hospitalRanking.js';

const DispatchContext = createContext(null);
const INCIDENTS_STORAGE_KEY = 'epf_dispatch_incidents_v1';

const INITIAL_DISPATCH_INCIDENTS = [
  {
    id: 'INC-2401',
    type: 'TRAUMA',
    typeLabel: 'Severe Road Trauma',
    locationName: 'Delhi Technical Campus Gate, Knowledge Park III',
    lat: 28.4625,
    lon: 77.4930,
    severity: 'CRITICAL',
    status: 'IN_PROGRESS',
    assignedUnitId: 'AMB-01',
    reportedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    notes: 'Multi-vehicle junction collision. Rapid trauma center corridor active.',
    isDemoScenario: true,
  },
  {
    id: 'INC-2402',
    type: 'CARDIAC',
    typeLabel: 'Acute Cardiac Arrest',
    locationName: 'Pari Chowk Central Rotary, Greater Noida',
    lat: 28.4795,
    lon: 77.5090,
    severity: 'HIGH',
    status: 'OPEN',
    assignedUnitId: null,
    reportedAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    notes: 'Requires ICU cardiac catheterization bay standby.',
    isDemoScenario: true,
  },
  {
    id: 'INC-2403',
    type: 'BURN',
    typeLabel: 'Industrial Thermal Burn',
    locationName: 'Surajpur / Pari Chowk North Corridor',
    lat: 28.4835,
    lon: 77.5095,
    severity: 'HIGH',
    status: 'OPEN',
    assignedUnitId: null,
    reportedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    notes: 'Priority burn unit triage requested.',
    isDemoScenario: true,
  },
  {
    id: 'INC-2398',
    type: 'GENERAL',
    typeLabel: 'Medical Transfer',
    locationName: 'Ansal Plaza Crossing, Sector Alpha',
    lat: 28.4810,
    lon: 77.5060,
    severity: 'MODERATE',
    status: 'RESOLVED',
    assignedUnitId: 'AMB-02',
    reportedAt: new Date(Date.now() - 46 * 60 * 1000).toISOString(),
    notes: 'Patient safely transferred to receiving emergency ward.',
    isDemoScenario: true,
  },
];

const STAGING_UNITS_BASE = [
  {
    id: 'AMB-02',
    registration: 'UP-16-AG-1082',
    unitType: 'ALS Cardiac Unit',
    baseStatus: 'AVAILABLE',
    locationName: 'Pari Chowk Central Rotary',
    lat: 28.4795,
    lon: 77.5090,
    isStagingRoster: true,
  },
  {
    id: 'AMB-03',
    registration: 'UP-16-AG-1083',
    unitType: 'Rapid Response Trauma Van',
    baseStatus: 'AVAILABLE',
    locationName: 'Pari Chowk North Sector Exit',
    lat: 28.4835,
    lon: 77.5095,
    isStagingRoster: true,
  },
  {
    id: 'AMB-04',
    registration: 'UP-16-AG-1084',
    unitType: 'BLS Support Unit',
    baseStatus: 'OUT_OF_SERVICE',
    locationName: 'Knowledge Park III Depot',
    lat: 28.4745,
    lon: 77.4827,
    isStagingRoster: true,
  },
];

export function DispatchProvider({ children }) {
  const graph = useGraph();
  const routing = useRouting(graph.weightedGraph, false, {
    weather: graph.weather,
    timeOfDay: graph.timeOfDay,
    liveWeather: graph.liveWeather,
    useLiveWeather: graph.useLiveWeather,
    incidents: graph.incidents,
  });
  const apiHealth = useApiHealth({ tomtomKey: graph.trafficConfig?.tomtomApiKey || '' });

  // Ambulance pin drag lock: false by default so accidental clicks do not move the ambulance pin
  const [canDragAmbulance, setCanDragAmbulance] = useState(false);

  const { setTheme } = useTheme();

  // Active tile layer mode: 'auto' (Night Map default) | 'street' (Day Map / Light Mode + Original OSM) | 'satellite'
  const [mapStyle, setMapStyle] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('epf_map_style_v3') || 'auto';
    }
    return 'auto';
  });

  useEffect(() => {
    setTheme(mapStyle === 'street' ? 'light' : 'dark');
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('epf_map_style_v3', mapStyle);
      } catch {}
    }
  }, [mapStyle, setTheme]);

  // Real-time road geometry and odometer telemetry resolved from OSRM
  const [roadTelemetry, setRoadTelemetryState] = useState(null);
  const routingRef = useRef(routing);
  routingRef.current = routing;

  const [selectedUnitId, setSelectedUnitId] = useState('AMB-01');
  const [selectedIncidentId, setSelectedIncidentId] = useState('INC-2401');

  const [dispatchIncidents, setDispatchIncidents] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(INCIDENTS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // ignore parse errors
      }
    }
    return INITIAL_DISPATCH_INCIDENTS;
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(dispatchIncidents));
      } catch {
        // ignore storage quota errors
      }
    }
  }, [dispatchIncidents]);

  const [activityLog, setActivityLog] = useState(() => [
    {
      id: 'act-init-1',
      time: new Date().toISOString(),
      title: 'Dispatch console initialized',
      detail: 'Loaded 5,000 Pan-India hospitals across all 36 States & UTs and 593-node OSM directed graph.',
      tone: 'primary',
    },
  ]);

  const pushActivity = useCallback((title, detail, tone = 'neutral') => {
    setActivityLog((prev) => [
      {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: new Date().toISOString(),
        title,
        detail,
        tone,
      },
      ...prev.slice(0, 24),
    ]);
  }, []);

  const setRoadTelemetry = useCallback((telemetry) => {
    setRoadTelemetryState(telemetry);
    if (!telemetry?.hospitalId) return;
    const curRouting = routingRef.current;
    const candidates = curRouting.topHospitals || [];
    const blocked = curRouting.blockedHospitalIds || [];
    const baseHospital = candidates.find((h) => h.id === telemetry.hospitalId) || curRouting.activeHospital;
    const hasAlternate = candidates.some((h) => h.id !== telemetry.hospitalId && !blocked.includes(h.id));
    if (hasAlternate && shouldSwitchHospitalForRoute(telemetry, baseHospital, curRouting.isHospitalLocked)) {
      curRouting.markHospitalBlocked(telemetry.hospitalId);
      pushActivity(
        'Diverted to alternate hospital',
        `${baseHospital?.shortName || baseHospital?.name || telemetry.hospitalId} corridor blocked by road closures`,
        'warning'
      );
    }
  }, [pushActivity]);

  const { setAmbulanceCoordinates, activeHospital, ambulancePos, setEmergencyCategory } = routing;

  const handleLiveLocationUpdate = useCallback(
    (lat, lon) => {
      setAmbulanceCoordinates(lat, lon);
    },
    [setAmbulanceCoordinates]
  );

  const live = useLiveLocation({
    onLocationUpdate: handleLiveLocationUpdate,
    activeRouteNodeIds: activeHospital?.pathNodeIds || [],
    graphNodes: graph.weightedGraph.nodes,
    initialPos: ambulancePos,
  });

  const createIncident = useCallback(
    (payload) => {
      const id = `INC-${Math.floor(2404 + Math.random() * 590)}`;
      const newInc = {
        id,
        type: payload.type || 'TRAUMA',
        typeLabel: payload.typeLabel || payload.type || 'Emergency Call',
        locationName: payload.locationName || 'Reported Dispatch Coordinate',
        lat: Number(payload.lat) || ambulancePos.lat,
        lon: Number(payload.lon) || ambulancePos.lon,
        severity: payload.severity || 'HIGH',
        status: payload.assignedUnitId ? 'DISPATCHED' : 'OPEN',
        assignedUnitId: payload.assignedUnitId || null,
        reportedAt: new Date().toISOString(),
        notes: payload.notes || '',
        isDemoScenario: false,
      };
      setDispatchIncidents((prev) => [newInc, ...prev]);
      setSelectedIncidentId(id);
      if (newInc.type) setEmergencyCategory(newInc.type);
      if (payload.focusMap !== false) {
        setAmbulanceCoordinates(newInc.lat, newInc.lon);
      }
      pushActivity('New emergency logged', `${id} · ${newInc.locationName}`, 'critical');
      return newInc;
    },
    [ambulancePos.lat, ambulancePos.lon, setAmbulanceCoordinates, setEmergencyCategory, pushActivity]
  );

  const updateIncidentStatus = useCallback(
    (incidentId, status) => {
      setDispatchIncidents((prev) =>
        prev.map((inc) => (inc.id === incidentId ? { ...inc, status } : inc))
      );
      pushActivity('Incident status updated', `${incidentId} marked as ${status.replace('_', ' ')}`, status === 'RESOLVED' ? 'success' : 'primary');
    },
    [pushActivity]
  );

  const assignUnitToIncident = useCallback(
    (incidentId, unitId) => {
      const target = dispatchIncidents.find((i) => i.id === incidentId);
      setDispatchIncidents((prev) =>
        prev.map((inc) =>
          inc.id === incidentId
            ? { ...inc, assignedUnitId: unitId, status: 'IN_PROGRESS' }
            : inc
        )
      );
      setSelectedIncidentId(incidentId);
      setSelectedUnitId(unitId);
      if (target) {
        if (target.type) setEmergencyCategory(target.type);
        setAmbulanceCoordinates(target.lat, target.lon);
      }
      pushActivity('Unit assigned', `${unitId} dispatched to ${incidentId}`, 'primary');
    },
    [dispatchIncidents, setAmbulanceCoordinates, setEmergencyCategory, pushActivity]
  );

  const focusIncidentOnMap = useCallback(
    (incident) => {
      if (!incident) return;
      setSelectedIncidentId(incident.id);
      if (incident.type) setEmergencyCategory(incident.type);
      setAmbulanceCoordinates(incident.lat, incident.lon);
      pushActivity('Map focused on incident', `${incident.id} · ${incident.locationName}`, 'neutral');
    },
    [setAmbulanceCoordinates, setEmergencyCategory, pushActivity]
  );

  const fleetUnits = useMemo(() => {
    const activeDistanceM = roadTelemetry?.distanceM || activeHospital?.distanceM || 0;
    const activeDurationSec = roadTelemetry?.durationSec || activeHospital?.travelTimeSec || 0;
    const assignedInc = dispatchIncidents.find((i) => i.assignedUnitId === 'AMB-01' && i.status !== 'RESOLVED');

    const primaryStatus = live.isGpsActive
      ? 'EN_ROUTE'
      : assignedInc
      ? 'TRANSPORTING'
      : 'AVAILABLE';

    const primaryUnit = {
      id: 'AMB-01',
      registration: 'UP-16-AG-1081',
      unitType: 'ALS Primary Tactical Unit',
      status: primaryStatus,
      locationName: routing.snappedSourceNode?.name || 'Active Dispatch Origin',
      lat: ambulancePos.lat,
      lon: ambulancePos.lon,
      assignedIncidentId: assignedInc?.id || null,
      destinationName: activeHospital?.shortName || activeHospital?.name || null,
      destinationId: activeHospital?.id || null,
      etaSec: activeDurationSec,
      distanceM: activeDistanceM,
      speedKph: Math.max(0, Math.round(live.gpsSpeedKph ?? 0)),
      isGpsLive: Boolean(live.isGpsActive),
      isStagingRoster: false,
    };

    const stagingUnits = STAGING_UNITS_BASE.map((u) => {
      const assigned = dispatchIncidents.find((i) => i.assignedUnitId === u.id && i.status !== 'RESOLVED');
      const status = u.baseStatus === 'OUT_OF_SERVICE'
        ? 'OUT_OF_SERVICE'
        : assigned
        ? 'DISPATCHED'
        : 'AVAILABLE';
      return {
        id: u.id,
        registration: u.registration,
        unitType: u.unitType,
        status,
        locationName: u.locationName,
        lat: assigned ? assigned.lat : u.lat,
        lon: assigned ? assigned.lon : u.lon,
        assignedIncidentId: assigned?.id || null,
        destinationName: assigned ? (activeHospital?.shortName || 'Assigned Corridor') : null,
        destinationId: null,
        etaSec: null,
        distanceM: null,
        speedKph: 0,
        isGpsLive: false,
        isStagingRoster: true,
      };
    });

    return [primaryUnit, ...stagingUnits];
  }, [
    ambulancePos.lat,
    ambulancePos.lon,
    routing.snappedSourceNode?.name,
    activeHospital,
    roadTelemetry,
    live.isGpsActive,
    live.gpsSpeedKph,
    dispatchIncidents,
  ]);

  const activateFleetUnitOnMap = useCallback(
    (unit) => {
      if (!unit) return;
      setSelectedUnitId(unit.id);
      setAmbulanceCoordinates(unit.lat, unit.lon);
      pushActivity('Active map unit focused', `${unit.id} at ${unit.locationName}`, 'primary');
    },
    [setAmbulanceCoordinates, pushActivity]
  );

  const value = useMemo(
    () => ({
      graph,
      routing,
      live,
      apiHealth,
      canDragAmbulance,
      setCanDragAmbulance,
      mapStyle,
      setMapStyle,
      roadTelemetry,
      setRoadTelemetry,
      dispatchIncidents,
      selectedIncidentId,
      setSelectedIncidentId,
      createIncident,
      updateIncidentStatus,
      assignUnitToIncident,
      focusIncidentOnMap,
      fleetUnits,
      selectedUnitId,
      setSelectedUnitId,
      activateFleetUnitOnMap,
      activityLog,
      pushActivity,
    }),
    [
      graph,
      routing,
      live,
      apiHealth,
      canDragAmbulance,
      mapStyle,
      roadTelemetry,
      dispatchIncidents,
      selectedIncidentId,
      createIncident,
      updateIncidentStatus,
      assignUnitToIncident,
      focusIncidentOnMap,
      fleetUnits,
      selectedUnitId,
      activateFleetUnitOnMap,
      activityLog,
      pushActivity,
    ]
  );

  return <DispatchContext.Provider value={value}>{children}</DispatchContext.Provider>;
}

export function useDispatch() {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error('useDispatch must be used within DispatchProvider');
  return ctx;
}
