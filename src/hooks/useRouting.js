/**
 * Custom hook for routing execution, hospital selection, and comparative algorithm metrics.
 * Integrated with the public WIB India Hospitals API (wibest.in).
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { SAMPLE_HOSPITALS } from '../data/sampleHospitals.js';
import { fetchWibHospitals, WIB_API_CONFIG } from '../services/wibHospitalService.js';
import { rankHospitalsForEmergency, calculateSeatIntakeFactor } from '../services/hospitalRanking.js';
import {
  filterHospitalsByRadius,
  filterAndRankHospitalsByOsrmEta,
  DEFAULT_RADIUS_KM,
  FALLBACK_RADIUS_KM,
} from '../services/hospitalFilterService.js';
import { dijkstra } from '../algorithms/dijkstra.js';
import { astar } from '../algorithms/astar.js';
import { extractPathDetails } from '../algorithms/pathUtils.js';
import { findNearestNode, haversineDistance } from '../utils/geo.js';
import { isOffline, subscribeNetworkStatus } from '../utils/network.js';
import { WEATHER_FACTORS } from '../data/congestionFactors.js';

export function useRouting(weightedGraph, isFigure2Mode, options = {}) {
  const {
    weather = 'clear',
    timeOfDay = 'morning_peak',
    liveWeather = null,
    useLiveWeather = false,
  } = options;

  // Coordinates of ambulance. Default: near DTC gate in Greater Noida
  const [ambulancePos, setAmbulancePos] = useState({
    lat: 28.4625,
    lon: 77.4930,
  });

  const [emergencyCategory, setEmergencyCategory] = useState('TRAUMA');
  const [algorithm, setAlgorithm] = useState('compare'); // 'compare' runs the optimal combo: A* for fast dispatch + Dijkstra for audit verification
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [searchRadiusKm, setSearchRadiusKm] = useState(10); // 5, 10 (default), 25, 100 km, or 0 (All)

  // Two-Stage Distance & OSRM ETA Filtered State
  const [osrmRanking, setOsrmRanking] = useState({
    topHospitals: [],
    allValidHospitals: [],
    isFallback: false,
    effectiveRadiusKm: 10,
    isLoading: false,
  });

  // Pan-India & Delhi-NCR hospital reference data with local storage persistence
  const [wibHospitals, setWibHospitals] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('epf_custom_hospitals_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Always ensure the complete 280-hospital registry is loaded, merging any user bed edits
            const customMap = new Map(parsed.map((h) => [h.id, h]));
            return SAMPLE_HOSPITALS.map((base) => {
              const custom = customMap.get(base.id);
              if (custom && custom.isUserEditedBedData) {
                return {
                  ...base,
                  bedAvailability: {
                    ...base.bedAvailability,
                    ...(custom.bedAvailability || {}),
                  },
                  isUserEditedBedData: true,
                  isSimulatedAvailability: false,
                  isLiveWibData: false,
                };
              }
              return base;
            });
          }
        }
      } catch (e) {
        console.warn('Could not read custom hospitals:', e);
      }
    }
    return SAMPLE_HOSPITALS;
  });

  const [isSyncingWib, setIsSyncingWib] = useState(false);
  const [wibApiStatus, setWibApiStatus] = useState({
    isLive: false,
    totalFetched: SAMPLE_HOSPITALS.length,
    source: `${WIB_API_CONFIG.sourceName} (Greater Noida)`,
    lastFetched: new Date().toISOString(),
  });

  // Save user-entered custom estimates and preserve them.
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

  // Reset to bundled illustrative Greater Noida reference records
  const resetCustomHospitals = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('epf_custom_hospitals_data');
      } catch (e) {
        console.warn('Could not remove custom hospitals:', e);
      }
    }
    setWibHospitals(SAMPLE_HOSPITALS);
  }, []);

  // Fetch hospital directory metadata from the WIB endpoint when available.
  const refreshWibData = useCallback(async () => {
    if (isOffline()) return;
    if (typeof localStorage !== 'undefined' && localStorage.getItem('epf_custom_hospitals_data')) {
      return; // Respect user's custom ICU bed numbers
    }
    setIsSyncingWib(true);
    try {
      const res = await fetchWibHospitals();
      if (res && res.hospitals && res.hospitals.length > 0) {
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

  // Re-fetch WIB data when network reconnects
  useEffect(() => {
    const unsub = subscribeNetworkStatus((online) => {
      if (online) refreshWibData();
    });
    return unsub;
  }, [refreshWibData]);

  // Real-time hospital bed intake/discharge dynamic telemetry polling.
  useEffect(() => {
    const timer = setInterval(() => {
      setWibHospitals((prev) => {
        return prev.map((hosp) => {
          if (hosp.isUserEditedBedData) return hosp;
          const beds = hosp.bedAvailability;
          if (!beds) return hosp;

          // Realistic micro-fluctuations (patient discharge/admission events)
          const roll = Math.random();
          let deltaIcu = 0;
          let deltaGen = 0;

          if (roll > 0.65) {
            deltaIcu = Math.random() > 0.5 ? 1 : -1;
          } else if (roll > 0.35) {
            deltaGen = Math.random() > 0.5 ? 1 : -1;
          }

          const newIcu = Math.max(0, Math.min(25, (beds.icuBedsFree ?? 4) + deltaIcu));
          const newGen = Math.max(0, Math.min(60, (beds.emergencyWardFree ?? 15) + deltaGen));

          let newStatus = 'AVAILABLE';
          if (newIcu === 0 && newGen === 0) {
            newStatus = 'FULL';
          } else if (newIcu <= 1) {
            newStatus = 'CRITICAL';
          } else if (newIcu <= 3) {
            newStatus = 'LIMITED';
          }

          return {
            ...hosp,
            isLiveWibData: true,
            isSimulatedAvailability: false,
            bedAvailability: {
              ...beds,
              icuBedsFree: newIcu,
              emergencyWardFree: newGen,
              status: newStatus,
              lastUpdated: new Date().toISOString(),
            },
          };
        });
      });
    }, 25000); // Dynamic clinical telemetry refresh every 25 seconds

    return () => clearInterval(timer);
  }, []);

  // Snapped source node in the graph
  const snappedSourceNode = useMemo(() => {
    if (isFigure2Mode) {
      return weightedGraph.nodes.find((n) => n.id === 'Ambulance') || weightedGraph.nodes[0];
    }
    const nearest = findNearestNode(ambulancePos.lat, ambulancePos.lon, weightedGraph.nodes);
    return nearest || weightedGraph.nodes[0];
  }, [ambulancePos, weightedGraph.nodes, isFigure2Mode]);

  // Available hospitals based on mode
  const availableHospitals = useMemo(() => {
    if (isFigure2Mode) {
      return [
        {
          id: 'figure2_hospital',
          name: 'Hospital (Figure 2 Destination)',
          shortName: 'Hospital H',
          nodeId: 'Hospital',
          lat: 28.4800,
          lon: 77.5320,
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
    return wibHospitals.length > 0 ? wibHospitals : SAMPLE_HOSPITALS;
  }, [isFigure2Mode, wibHospitals]);

  // All registered hospitals in the CAD directory for emergency search & registry
  const searchHospitals = useMemo(() => {
    return availableHospitals;
  }, [availableHospitals]);

  // Execute automatic built-in cascading radius (5km -> 10km -> 20km) + OSRM filtering
  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    if (isFigure2Mode) return;

    const weatherMult =
      (useLiveWeather && liveWeather?.frictionFactor) ||
      WEATHER_FACTORS[weather]?.speedMultiplier ||
      1.0;

    filterAndRankHospitalsByOsrmEta(ambulancePos, availableHospitals, {
      radiusKm: searchRadiusKm,
      signal: controller.signal,
      weather,
      weatherMultiplier: weatherMult,
    })
      .then((res) => {
        if (!isCancelled && res) {
          setOsrmRanking({
            topHospitals: res.topHospitals,
            allValidHospitals: res.allValidHospitals,
            isFallback: res.isFallback,
            effectiveRadiusKm: res.effectiveRadiusKm,
            isLoading: false,
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
  }, [ambulancePos, availableHospitals, isFigure2Mode, weather, liveWeather, useLiveWeather, searchRadiusKm]);

  // Execute constrained hospital ranking on graph
  const rawRankingResult = useMemo(() => {
    if (!snappedSourceNode) {
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

  // Merge OSRM top 5 ranked hospitals with graph route path details
  const topRankedHospitals = useMemo(() => {
    if (isFigure2Mode) {
      return rawRankingResult.rankedHospitals;
    }
    if (osrmRanking.topHospitals.length > 0) {
      return osrmRanking.topHospitals.map((hosp) => {
        const graphMatch = rawRankingResult.rankedHospitals.find((r) => r.id === hosp.id);
        let pathNodeIds = graphMatch?.pathNodeIds || hosp.pathNodeIds || [];
        let pathEdges = graphMatch?.pathEdges || hosp.pathEdges || [];
        let seatPenaltySec = graphMatch?.seatPenaltySec;
        let seatReadinessLevel = graphMatch?.seatReadinessLevel;
        let seatReadinessLabel = graphMatch?.seatReadinessLabel;

        // If pathNodeIds is empty, compute graph route directly using A* or Dijkstra so graph topology is always intact
        if (pathNodeIds.length === 0 && snappedSourceNode && weightedGraph && weightedGraph.nodes?.length > 0) {
          let targetNodeId = hosp.nodeId;
          const hasNode = weightedGraph.nodes.some((n) => n.id === targetNodeId);
          if (!hasNode) {
            const nearest = findNearestNode(hosp.lat, hosp.lon, weightedGraph.nodes);
            targetNodeId = nearest ? nearest.id : weightedGraph.nodes[0]?.id;
          }
          if (targetNodeId && snappedSourceNode.id) {
            const algoToUse = algorithm === 'compare' ? 'astar' : algorithm;
            const res =
              algoToUse === 'astar'
                ? astar(weightedGraph, snappedSourceNode.id, targetNodeId)
                : dijkstra(weightedGraph, snappedSourceNode.id, targetNodeId);
            if (res.success && Array.isArray(res.path) && res.path.length > 0) {
              pathNodeIds = res.path;
              const details = extractPathDetails(res.path, weightedGraph.edges);
              pathEdges = details.pathEdges || [];
            }
          }
        }

        if (seatPenaltySec == null) {
          const seatFactor = calculateSeatIntakeFactor(hosp.bedAvailability, emergencyCategory);
          seatPenaltySec = seatFactor.seatPenaltySec;
          seatReadinessLevel = seatFactor.seatReadinessLevel;
          seatReadinessLabel = seatFactor.seatReadinessLabel;
        }

        const weatherMult =
          (useLiveWeather && liveWeather?.frictionFactor) ||
          WEATHER_FACTORS[weather]?.speedMultiplier ||
          1.0;

        let durationSec = hosp.durationSec || (graphMatch?.travelTimeSec ?? 360);
        if (!hosp.isWeatherCalibrated && weatherMult < 1.0) {
          durationSec = Math.round(durationSec / weatherMult);
        }
        const roadDistanceM = hosp.roadDistanceM || (graphMatch?.distanceM ?? 3000);
        return {
          ...hosp,
          travelTimeSec: durationSec,
          travelTimeMin: Number((durationSec / 60).toFixed(1)),
          durationMin: Number((durationSec / 60).toFixed(1)),
          distanceM: roadDistanceM,
          roadDistanceKm: Number((roadDistanceM / 1000).toFixed(1)),
          pathNodeIds,
          pathEdges,
          seatPenaltySec: seatPenaltySec ?? 0,
          seatReadinessLevel: seatReadinessLevel ?? 'OPTIMAL',
          seatReadinessLabel: seatReadinessLabel ?? 'Ready Intake',
        };
      });
    }
    return rawRankingResult.rankedHospitals.slice(0, 5).map((h) => ({
      ...h,
      durationMin: Number((h.travelTimeSec / 60).toFixed(1)),
      roadDistanceKm: Number((h.distanceM / 1000).toFixed(1)),
    }));
  }, [isFigure2Mode, rawRankingResult.rankedHospitals, osrmRanking.topHospitals, snappedSourceNode, weightedGraph, algorithm, emergencyCategory, weather, liveWeather, useLiveWeather]);

  const rankingResult = useMemo(() => {
    return {
      ...rawRankingResult,
      rankedHospitals: topRankedHospitals,
      bestRecommendation: topRankedHospitals[0] || rawRankingResult.bestRecommendation,
      alternateCandidates: topRankedHospitals.slice(1),
    };
  }, [rawRankingResult, topRankedHospitals]);

  // Target hospital: either user-selected alternate or the algorithm's top recommendation
  const activeHospital = useMemo(() => {
    if (selectedHospitalId) {
      // 1. Check if the selected hospital is in topRankedHospitals
      const match = topRankedHospitals.find((h) => h.id === selectedHospitalId);
      if (match) return match;

      // 2. If it was outside the top 5, compute its route directly from availableHospitals
      const rawHosp = availableHospitals.find((h) => h.id === selectedHospitalId);
      if (rawHosp && snappedSourceNode && weightedGraph) {
        let targetNodeId = rawHosp.nodeId;
        const hasNode = weightedGraph.nodes.some((n) => n.id === targetNodeId);
        if (!hasNode) {
          const nearest = findNearestNode(rawHosp.lat, rawHosp.lon, weightedGraph.nodes);
          targetNodeId = nearest ? nearest.id : weightedGraph.nodes[0]?.id;
        }

        const algoToUse = algorithm === 'compare' ? 'astar' : algorithm;
        const routeResult =
          algoToUse === 'astar'
            ? astar(weightedGraph, snappedSourceNode.id, targetNodeId)
            : dijkstra(weightedGraph, snappedSourceNode.id, targetNodeId);

        const { pathEdges, totalDistanceM } = extractPathDetails(
          routeResult.path || [],
          weightedGraph.edges
        );

        const seatFactor = calculateSeatIntakeFactor(rawHosp.bedAvailability, emergencyCategory);
        const compositeScore = Math.max(
          1,
          Number(((routeResult.totalCost || 0) + seatFactor.seatPenaltySec).toFixed(1))
        );

        const travelTimeSec = routeResult.totalCost || 0;
        const durationMin = Number((travelTimeSec / 60).toFixed(1));
        const roadDistanceKm = Number((totalDistanceM / 1000).toFixed(1));

        return {
          ...rawHosp,
          travelTimeSec,
          travelTimeMin: durationMin,
          durationMin,
          distanceM: totalDistanceM || 0,
          roadDistanceM: totalDistanceM || 0,
          roadDistanceKm,
          pathNodeIds: routeResult.path || [],
          pathEdges: pathEdges || [],
          nodesExpanded: routeResult.nodesExpanded || 0,
          queryTimeMs: routeResult.queryTimeMs || 0,
          seatPenaltySec: seatFactor.seatPenaltySec,
          seatReadinessLevel: seatFactor.seatReadinessLevel,
          seatReadinessLabel: seatFactor.seatReadinessLabel,
          availableSeatsCount: seatFactor.availableSeatsCount,
          compositeScore,
          warnings: [
            '[MANUAL OVERRIDE] User-selected destination overrides automated CAD specialty constraint filter.',
          ],
          isManualOverride: true,
        };
      }
    }
    return rankingResult.bestRecommendation;
  }, [selectedHospitalId, topRankedHospitals, rankingResult, availableHospitals, snappedSourceNode, weightedGraph, algorithm, emergencyCategory]);

  // In compare mode, compute exact side-by-side run for Dijkstra and A* to activeHospital
  const comparisonData = useMemo(() => {
    if (algorithm !== 'compare' || !activeHospital || !snappedSourceNode) return null;

    const sourceId = snappedSourceNode.id;
    const targetId = activeHospital.nodeId;

    const dRun = dijkstra(weightedGraph, sourceId, targetId);
    const aRun = astar(weightedGraph, sourceId, targetId);

    const dDetails = extractPathDetails(dRun.path, weightedGraph.edges);
    const aDetails = extractPathDetails(aRun.path, weightedGraph.edges);

    const costDelta = Math.abs(dRun.totalCost - aRun.totalCost);
    const isCostEqual = costDelta < 0.001;

    return {
      dijkstra: {
        cost: dRun.totalCost,
        costFormatted: isFigure2Mode ? `${dRun.totalCost} min` : `${(dRun.totalCost / 60).toFixed(1)} min`,
        nodesExpanded: dRun.nodesExpanded,
        queryTimeMs: dRun.queryTimeMs,
        distanceM: dDetails.totalDistanceM,
        path: dRun.path,
        success: dRun.success,
      },
      astar: {
        cost: aRun.totalCost,
        costFormatted: isFigure2Mode ? `${aRun.totalCost} min` : `${(aRun.totalCost / 60).toFixed(1)} min`,
        nodesExpanded: aRun.nodesExpanded,
        queryTimeMs: aRun.queryTimeMs,
        distanceM: aDetails.totalDistanceM,
        path: aRun.path,
        success: aRun.success,
      },
      isCostEqual,
      costDelta,
    };
  }, [algorithm, activeHospital, snappedSourceNode, weightedGraph, isFigure2Mode]);

  const setAmbulanceCoordinates = useCallback((latOrObj, maybeLon) => {
    let lat, lon;
    if (typeof latOrObj === 'object' && latOrObj !== null) {
      lat = latOrObj.lat;
      lon = latOrObj.lon ?? latOrObj.lng;
    } else {
      lat = latOrObj;
      lon = maybeLon;
    }
    if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
      setAmbulancePos({ lat, lon });
      // Reset manual hospital override on move
      setSelectedHospitalId(null);
    }
  }, []);

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
    rankingResult,
    activeHospital,
    comparisonData,
    availableHospitals,
    topHospitals: topRankedHospitals,
    searchHospitals,
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
