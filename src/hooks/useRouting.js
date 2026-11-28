import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  loadPanIndiaHospitals,
  getCachedPanIndiaHospitals,
} from '../services/hospitalDataService.js';
import { OSM_GREATER_NOIDA_POIS } from '../data/osmRegionalPois.js';
import { fetchWibHospitals, WIB_API_CONFIG } from '../services/wibHospitalService.js';
import {
  rankHospitalsForEmergency,
  resolveHospitalSelectionOnEvent,
  ensureActiveHospitalInList,
  filterBlockedHospitals,
} from '../services/hospitalRanking.js';
import { filterAndRankHospitalsByOsrmEta } from '../services/hospitalFilterService.js';
import { findNearestNode } from '../utils/geo.js';
import { isOffline, subscribeNetworkStatus } from '../utils/network.js';
import { EMERGENCY_CATEGORIES } from '../config/emergencyCategories.js';
import { DEFAULT_AMBULANCE_ORIGIN } from '../config/constants.js';
import {
  applySimulatedBedTelemetryTick,
  buildAlgorithmComparison,
  buildManualOverrideHospital,
  enrichTopRankedHospitals,
  getCombinedSpeedMultiplier,
  mergeCustomBedOverrides,
  parseCoordinateArgs,
} from '../utils/routingHelpers.js';

export function useRouting(weightedGraph, isFigure2Mode, options = {}) {
  const {
    weather = 'clear',
    timeOfDay = 'morning_peak',
    liveWeather = null,
    useLiveWeather = false,
    incidents = null,
  } = options;

  const [ambulancePos, setAmbulancePos] = useState({
    lat: DEFAULT_AMBULANCE_ORIGIN.lat,
    lon: DEFAULT_AMBULANCE_ORIGIN.lon,
  });

  const [emergencyCategory, setEmergencyCategoryState] = useState('TRAUMA');
  const [algorithm, setAlgorithm] = useState('compare');
  const [selectedHospitalId, setSelectedHospitalIdState] = useState(null);
  const [isHospitalLocked, setIsHospitalLocked] = useState(false);
  const [searchRadiusKm, setSearchRadiusKm] = useState(10);
  const [blockedHospitalIds, setBlockedHospitalIds] = useState([]);

  const closedIncidentCount = useMemo(() => {
    if (!(incidents instanceof Map)) return 0;
    let count = 0;
    for (const inc of incidents.values()) {
      if (inc?.closed) count++;
    }
    return count;
  }, [incidents]);

  const prevClosedCountRef = useRef(0);
  useEffect(() => {
    if (closedIncidentCount === 0 || closedIncidentCount < prevClosedCountRef.current) {
      setBlockedHospitalIds([]);
    }
    prevClosedCountRef.current = closedIncidentCount;
  }, [closedIncidentCount]);

  useEffect(() => {
    setBlockedHospitalIds([]);
  }, [ambulancePos.lat, ambulancePos.lon, emergencyCategory, searchRadiusKm, isHospitalLocked]);

  const lockStateRef = useRef({
    selectedHospitalId: null,
    isHospitalLocked: false,
    activeHospitalId: null,
  });
  lockStateRef.current.selectedHospitalId = selectedHospitalId;
  lockStateRef.current.isHospitalLocked = isHospitalLocked;

  const applySelectionState = useCallback((nextState) => {
    lockStateRef.current.selectedHospitalId = nextState.selectedHospitalId;
    lockStateRef.current.isHospitalLocked = nextState.isHospitalLocked;
    setSelectedHospitalIdState(nextState.selectedHospitalId);
    setIsHospitalLocked(nextState.isHospitalLocked);
  }, []);

  const setSelectedHospitalId = useCallback((hospitalId) => {
    applySelectionState(
      resolveHospitalSelectionOnEvent(lockStateRef.current, { type: 'SELECT_HOSPITAL', hospitalId })
    );
  }, [applySelectionState]);

  const setEmergencyCategory = useCallback((catId) => {
    setEmergencyCategoryState(catId);
    applySelectionState(resolveHospitalSelectionOnEvent(lockStateRef.current, { type: 'CATEGORY_CHANGED' }));
  }, [applySelectionState]);

  const toggleHospitalLock = useCallback(() => {
    applySelectionState(resolveHospitalSelectionOnEvent(lockStateRef.current, { type: 'TOGGLE_LOCK' }));
  }, [applySelectionState]);

  const markHospitalBlocked = useCallback((hospitalId) => {
    if (!hospitalId || lockStateRef.current.isHospitalLocked) return;
    setBlockedHospitalIds((prev) => (prev.includes(hospitalId) ? prev : [...prev, hospitalId]));
    if (lockStateRef.current.selectedHospitalId === hospitalId) {
      applySelectionState({ selectedHospitalId: null, isHospitalLocked: false });
    }
  }, [applySelectionState]);

  const requiredSpecialty =
    (EMERGENCY_CATEGORIES[emergencyCategory] || EMERGENCY_CATEGORIES.GENERAL).requiredSpecialty;

  const [osrmRanking, setOsrmRanking] = useState({
    topHospitals: [],
    allValidHospitals: [],
    isFallback: false,
    effectiveRadiusKm: 10,
    isLoading: false,
  });

  const [wibHospitals, setWibHospitals] = useState(() => {
    const cached = getCachedPanIndiaHospitals();
    return cached.length > 0 ? mergeCustomBedOverrides(cached) : [];
  });

  const [isSyncingWib, setIsSyncingWib] = useState(false);
  const [wibApiStatus, setWibApiStatus] = useState({
    isLive: false,
    totalFetched: getCachedPanIndiaHospitals().length,
    source: `${WIB_API_CONFIG.sourceName} (Greater Noida)`,
    lastFetched: new Date().toISOString(),
  });

  useEffect(() => {
    let cancelled = false;
    loadPanIndiaHospitals()
      .then((baseList) => {
        if (cancelled) return;
        const merged = mergeCustomBedOverrides(baseList);
        setWibHospitals((prev) => (prev.length >= merged.length ? prev : merged));
        setWibApiStatus((prev) => ({ ...prev, totalFetched: merged.length }));
      })
      .catch((err) => {
        console.warn('Failed to load Pan-India hospital registry JSON:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveCustomHospitals = useCallback((newList) => {
    const userEditedList = newList.map((hospital) => ({
      ...hospital,
      isUserEditedBedData: true,
      isSimulatedAvailability: false,
      isLiveWibData: true,
      bedAvailability: {
        ...hospital.bedAvailability,
        source: 'Custom Dispatcher Bed Capacity Override',
      },
    }));
    setWibHospitals(userEditedList);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('epf_custom_hospitals_data', JSON.stringify(userEditedList));
      } catch (e) {
        console.warn('Could not save custom hospitals:', e);
      }
    }
  }, []);

  const resetCustomHospitals = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('epf_custom_hospitals_data');
      } catch (e) {
        console.warn('Could not remove custom hospitals:', e);
      }
    }
    loadPanIndiaHospitals().then(setWibHospitals).catch(() => {});
  }, []);

  const refreshWibData = useCallback(async () => {
    if (isOffline()) return;
    if (typeof localStorage !== 'undefined' && localStorage.getItem('epf_custom_hospitals_data')) {
      return;
    }
    setIsSyncingWib(true);
    try {
      const res = await fetchWibHospitals();
      if (res?.hospitals?.length > 0) {
        setWibHospitals(res.hospitals);
        setWibApiStatus({
          isLive: res.isLive,
          totalFetched: res.totalFetched,
          source: res.source,
          lastFetched: new Date().toISOString(),
        });
      }
    } catch (err) {
      if (!isOffline()) {
        console.warn('Could not sync WIB API data:', err);
      }
    } finally {
      setIsSyncingWib(false);
    }
  }, []);

  useEffect(() => {
    refreshWibData();
  }, [refreshWibData]);

  useEffect(() => {
    return subscribeNetworkStatus((online) => {
      if (online) refreshWibData();
    });
  }, [refreshWibData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setWibHospitals((prev) => applySimulatedBedTelemetryTick(prev));
    }, 25000);
    return () => clearInterval(timer);
  }, []);

  const snappedSourceNode = useMemo(() => {
    if (isFigure2Mode) {
      return weightedGraph.nodes.find((n) => n.id === 'Ambulance') || weightedGraph.nodes[0];
    }
    return findNearestNode(ambulancePos.lat, ambulancePos.lon, weightedGraph.nodes) || weightedGraph.nodes[0];
  }, [ambulancePos, weightedGraph.nodes, isFigure2Mode]);

  const availableHospitals = useMemo(() => {
    if (isFigure2Mode) {
      return [
        {
          id: 'figure2_hospital',
          name: 'Hospital (Figure 2 Destination)',
          shortName: 'Hospital H',
          nodeId: 'Hospital',
          lat: 28.48,
          lon: 77.532,
          specialties: ['trauma_center', 'cardiology', 'burn_unit', 'general_emergency'],
          specialtyLabels: ['Figure 2 Benchmark Destination'],
          bedAvailability: {
            status: 'AVAILABLE',
            icuBedsFree: 1,
            emergencyWardFree: 5,
            source: 'Report Schematic Figure 2',
            lastUpdated: new Date().toISOString(),
          },
        },
      ];
    }
    return wibHospitals.length > 0 ? wibHospitals : getCachedPanIndiaHospitals();
  }, [isFigure2Mode, wibHospitals]);

  const speedMultiplier = useMemo(
    () => getCombinedSpeedMultiplier({ weather, timeOfDay, liveWeather, useLiveWeather }),
    [weather, timeOfDay, liveWeather, useLiveWeather]
  );

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    if (isFigure2Mode || availableHospitals.length === 0) return;

    const weatherMult =
      (useLiveWeather && liveWeather?.frictionFactor) ||
      getCombinedSpeedMultiplier({ weather, timeOfDay: 'off_peak' });
    const timeMult = getCombinedSpeedMultiplier({ weather: 'clear', timeOfDay });

    filterAndRankHospitalsByOsrmEta(ambulancePos, availableHospitals, {
      radiusKm: searchRadiusKm,
      requiredSpecialty,
      signal: controller.signal,
      weather,
      weatherMultiplier: weatherMult,
      timeOfDay,
      timeOfDayMultiplier: timeMult,
    })
      .then((res) => {
        if (!isCancelled && res) {
          setOsrmRanking({
            topHospitals: res.topHospitals,
            allValidHospitals: res.allValidHospitals,
            isFallback: res.isFallback,
            effectiveRadiusKm: res.effectiveRadiusKm,
            requestedRadiusKm: searchRadiusKm,
            isLoading: false,
            specialty: requiredSpecialty,
          });
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('OSRM ranking update error:', err);
        }
      });

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [ambulancePos, availableHospitals, isFigure2Mode, weather, liveWeather, useLiveWeather, timeOfDay, searchRadiusKm, requiredSpecialty]);

  const rawRankingResult = useMemo(() => {
    if (!snappedSourceNode || availableHospitals.length === 0) {
      return {
        rankedHospitals: [],
        bestRecommendation: null,
        alternateCandidates: [],
        filteredOutCount: 0,
        unreachableCount: 0,
      };
    }

    const algoToUse = algorithm === 'compare' ? 'astar' : algorithm;
    return rankHospitalsForEmergency(
      availableHospitals,
      snappedSourceNode.id,
      weightedGraph,
      emergencyCategory,
      algoToUse
    );
  }, [availableHospitals, snappedSourceNode, weightedGraph, emergencyCategory, algorithm]);

  const topRankedHospitals = useMemo(
    () =>
      enrichTopRankedHospitals({
        isFigure2Mode,
        rawRankedHospitals: rawRankingResult.rankedHospitals,
        osrmRanking,
        searchRadiusKm,
        ambulancePos,
        snappedSourceNode,
        weightedGraph,
        algorithm,
        requiredSpecialty,
        speedMultiplier,
      }),
    [
      isFigure2Mode,
      rawRankingResult.rankedHospitals,
      osrmRanking,
      searchRadiusKm,
      ambulancePos,
      snappedSourceNode,
      weightedGraph,
      algorithm,
      requiredSpecialty,
      speedMultiplier,
    ]
  );

  const rankingResult = useMemo(() => {
    const unblockedList = filterBlockedHospitals(topRankedHospitals, blockedHospitalIds);
    return {
      ...rawRankingResult,
      rankedHospitals: topRankedHospitals,
      bestRecommendation: unblockedList[0] || rawRankingResult.bestRecommendation,
      alternateCandidates: unblockedList.slice(1),
    };
  }, [rawRankingResult, topRankedHospitals, blockedHospitalIds]);

  const activeHospital = useMemo(() => {
    if (selectedHospitalId) {
      const match = topRankedHospitals.find((h) => h.id === selectedHospitalId);
      if (match) return match;

      const manual = buildManualOverrideHospital({
        selectedHospitalId,
        availableHospitals,
        osmPois: OSM_GREATER_NOIDA_POIS,
        weightedGraph,
        snappedSourceNode,
        algorithm,
        requiredSpecialty,
      });
      if (manual) return manual;
    }
    return rankingResult.bestRecommendation;
  }, [selectedHospitalId, topRankedHospitals, rankingResult, availableHospitals, snappedSourceNode, weightedGraph, algorithm, requiredSpecialty]);

  lockStateRef.current.activeHospitalId = activeHospital?.id || null;

  const visibleHospitals = useMemo(
    () => ensureActiveHospitalInList(topRankedHospitals, activeHospital),
    [topRankedHospitals, activeHospital]
  );

  const comparisonData = useMemo(
    () =>
      buildAlgorithmComparison({
        algorithm,
        activeHospital,
        snappedSourceNode,
        weightedGraph,
        isFigure2Mode,
      }),
    [algorithm, activeHospital, snappedSourceNode, weightedGraph, isFigure2Mode]
  );

  const setAmbulanceCoordinates = useCallback((latOrObj, maybeLon) => {
    const { lat, lon } = parseCoordinateArgs(latOrObj, maybeLon);
    if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
      setAmbulancePos({ lat, lon });
      applySelectionState(
        resolveHospitalSelectionOnEvent(lockStateRef.current, { type: 'AMBULANCE_MOVED' })
      );
    }
  }, [applySelectionState]);

  return {
    ambulancePos,
    setAmbulanceCoordinates,
    snappedSourceNode,
    emergencyCategory,
    setEmergencyCategory,
    algorithm,
    setAlgorithm,
    selectedHospitalId,
    setSelectedHospitalId,
    isHospitalLocked,
    toggleHospitalLock,
    blockedHospitalIds,
    markHospitalBlocked,
    rankingResult,
    activeHospital,
    comparisonData,
    availableHospitals,
    topHospitals: visibleHospitals,
    searchHospitals: availableHospitals,
    searchRadiusKm,
    setSearchRadiusKm,
    effectiveRadiusKm: searchRadiusKm === 0 ? 0 : (osrmRanking.effectiveRadiusKm || searchRadiusKm),
    isRadiusFallback: osrmRanking.isFallback,
    wibApiStatus,
    refreshWibData,
    isSyncingWib,
    saveCustomHospitals,
    resetCustomHospitals,
  };
}
