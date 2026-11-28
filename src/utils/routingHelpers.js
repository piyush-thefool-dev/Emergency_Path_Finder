import {
  calculateSeatIntakeFactor,
} from '../services/hospitalRanking.js';
import { dijkstra } from '../algorithms/dijkstra.js';
import { astar } from '../algorithms/astar.js';
import { extractPathDetails } from '../algorithms/pathUtils.js';
import { findNearestNode, haversineDistance } from './geo.js';
import { WEATHER_FACTORS, TIME_OF_DAY_FACTORS } from '../data/congestionFactors.js';

export function mergeCustomBedOverrides(baseList) {
  if (typeof localStorage === 'undefined' || !Array.isArray(baseList) || baseList.length === 0) {
    return baseList || [];
  }
  try {
    const stored = localStorage.getItem('epf_custom_hospitals_data');
    if (!stored) return baseList;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) return baseList;

    const customMap = new Map(parsed.map((h) => [h.id, h]));
    return baseList.map((base) => {
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
  } catch (e) {
    console.warn('Could not read custom hospitals:', e);
    return baseList;
  }
}

export function getCombinedSpeedMultiplier({
  weather = 'clear',
  timeOfDay = 'morning_peak',
  liveWeather = null,
  useLiveWeather = false,
}) {
  const weatherMult =
    (useLiveWeather && liveWeather?.frictionFactor) ||
    WEATHER_FACTORS[weather]?.speedMultiplier ||
    1.0;
  const timeMult = TIME_OF_DAY_FACTORS[timeOfDay]?.speedMultiplier || 1.0;
  return Math.max(0.2, weatherMult * timeMult);
}

export function parseCoordinateArgs(latOrObj, maybeLon) {
  if (typeof latOrObj === 'object' && latOrObj !== null) {
    return { lat: latOrObj.lat, lon: latOrObj.lon ?? latOrObj.lng };
  }
  return { lat: latOrObj, lon: maybeLon };
}

export function resolveTargetNodeId(hosp, weightedGraph) {
  if (!hosp || !weightedGraph?.nodes?.length) return null;
  if (weightedGraph.nodes.some((n) => n.id === hosp.nodeId)) {
    return hosp.nodeId;
  }
  const nearest = findNearestNode(hosp.lat, hosp.lon, weightedGraph.nodes);
  return nearest ? nearest.id : weightedGraph.nodes[0]?.id || null;
}

export function applySimulatedBedTelemetryTick(hospitals) {
  const updatedAt = new Date().toISOString();
  return hospitals.map((hosp) => {
    if (hosp.isUserEditedBedData || !hosp.bedAvailability) return hosp;
    const beds = hosp.bedAvailability;
    const roll = Math.random();
    const deltaIcu = roll > 0.65 ? (Math.random() > 0.5 ? 1 : -1) : 0;
    const deltaGen = roll <= 0.65 && roll > 0.35 ? (Math.random() > 0.5 ? 1 : -1) : 0;

    const newIcu = Math.max(0, Math.min(25, (beds.icuBedsFree ?? 4) + deltaIcu));
    const newGen = Math.max(0, Math.min(60, (beds.emergencyWardFree ?? 15) + deltaGen));

    let newStatus = 'AVAILABLE';
    if (newIcu === 0 && newGen === 0) newStatus = 'FULL';
    else if (newIcu <= 1) newStatus = 'CRITICAL';
    else if (newIcu <= 3) newStatus = 'LIMITED';

    return {
      ...hosp,
      isLiveWibData: true,
      isSimulatedAvailability: false,
      bedAvailability: {
        ...beds,
        icuBedsFree: newIcu,
        emergencyWardFree: newGen,
        status: newStatus,
        lastUpdated: updatedAt,
      },
    };
  });
}

export function enrichTopRankedHospitals({
  isFigure2Mode,
  rawRankedHospitals,
  osrmRanking,
  searchRadiusKm,
  ambulancePos,
  snappedSourceNode,
  weightedGraph,
  algorithm,
  requiredSpecialty,
  speedMultiplier,
}) {
  if (isFigure2Mode) {
    return rawRankedHospitals;
  }

  const specialtyMatchedOsrm = osrmRanking.topHospitals.filter(
    (hosp) => Array.isArray(hosp.specialties) && hosp.specialties.includes(requiredSpecialty)
  );
  const osrmMatchesRadius =
    osrmRanking.requestedRadiusKm == null || osrmRanking.requestedRadiusKm === searchRadiusKm;
  const osrmMatchesSpecialty = !osrmRanking.specialty || osrmRanking.specialty === requiredSpecialty;

  if (specialtyMatchedOsrm.length > 0 && osrmMatchesSpecialty && osrmMatchesRadius) {
    const algoToUse = algorithm === 'compare' ? 'astar' : algorithm;

    return specialtyMatchedOsrm.map((hosp) => {
      const graphMatch = rawRankedHospitals.find((r) => r.id === hosp.id);
      let pathNodeIds = graphMatch?.pathNodeIds || hosp.pathNodeIds || [];
      let pathEdges = graphMatch?.pathEdges || hosp.pathEdges || [];

      if (pathNodeIds.length === 0 && snappedSourceNode && weightedGraph?.nodes?.length > 0) {
        const targetNodeId = resolveTargetNodeId(hosp, weightedGraph);
        if (targetNodeId && snappedSourceNode.id) {
          const res =
            algoToUse === 'astar'
              ? astar(weightedGraph, snappedSourceNode.id, targetNodeId)
              : dijkstra(weightedGraph, snappedSourceNode.id, targetNodeId);
          if (res.success && Array.isArray(res.path) && res.path.length > 0) {
            pathNodeIds = res.path;
            pathEdges = extractPathDetails(res.path, weightedGraph.edges).pathEdges || [];
          }
        }
      }

      const seatFactor =
        graphMatch?.seatPenaltySec != null
          ? graphMatch
          : calculateSeatIntakeFactor(hosp.bedAvailability, requiredSpecialty);

      let durationSec = hosp.durationSec || (graphMatch?.travelTimeSec ?? 360);
      if (!hosp.isScenarioCalibrated && !hosp.isWeatherCalibrated && speedMultiplier < 1.0) {
        durationSec = Math.round(durationSec / speedMultiplier);
      }

      const roadDistanceM = hosp.roadDistanceM || (graphMatch?.distanceM ?? 3000);
      const durationMin = Number((durationSec / 60).toFixed(1));

      return {
        ...hosp,
        travelTimeSec: durationSec,
        travelTimeMin: durationMin,
        durationMin,
        distanceM: roadDistanceM,
        roadDistanceKm: Number((roadDistanceM / 1000).toFixed(1)),
        pathNodeIds,
        pathEdges,
        seatPenaltySec: seatFactor.seatPenaltySec ?? 0,
        seatReadinessLevel: seatFactor.seatReadinessLevel ?? 'OPTIMAL',
        seatReadinessLabel: seatFactor.seatReadinessLabel ?? 'Ready Intake',
      };
    });
  }

  const effectiveRad =
    searchRadiusKm === 0
      ? 0
      : osrmMatchesRadius
      ? osrmRanking.effectiveRadiusKm || searchRadiusKm
      : searchRadiusKm;

  const withinRange =
    searchRadiusKm === 0 || effectiveRad === 0
      ? rawRankedHospitals
      : rawRankedHospitals.filter(
          (h) => haversineDistance(ambulancePos.lat, ambulancePos.lon, h.lat, h.lon) / 1000 <= effectiveRad
        );

  const fallbackList = withinRange.length > 0 ? withinRange : rawRankedHospitals.slice(0, 5);
  return fallbackList.map((h) => ({
    ...h,
    durationMin: Number((h.travelTimeSec / 60).toFixed(1)),
    roadDistanceKm: Number((h.distanceM / 1000).toFixed(1)),
  }));
}

export function buildManualOverrideHospital({
  selectedHospitalId,
  availableHospitals,
  osmPois,
  weightedGraph,
  snappedSourceNode,
  algorithm,
  requiredSpecialty,
}) {
  const rawHosp =
    availableHospitals.find((h) => h.id === selectedHospitalId) ||
    osmPois.find((h) => h.id === selectedHospitalId);
  if (!rawHosp || !snappedSourceNode || !weightedGraph) return null;

  const targetNodeId = resolveTargetNodeId(rawHosp, weightedGraph);
  const algoToUse = algorithm === 'compare' ? 'astar' : algorithm;
  const routeResult =
    algoToUse === 'astar'
      ? astar(weightedGraph, snappedSourceNode.id, targetNodeId)
      : dijkstra(weightedGraph, snappedSourceNode.id, targetNodeId);

  const { pathEdges, totalDistanceM } = extractPathDetails(
    routeResult.path || [],
    weightedGraph.edges
  );

  const seatFactor = calculateSeatIntakeFactor(rawHosp.bedAvailability, requiredSpecialty);
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
    compositeScore: Math.max(
      1,
      Number(((routeResult.totalCost || 0) + seatFactor.seatPenaltySec).toFixed(1))
    ),
    warnings: [
      '[MANUAL OVERRIDE] User-selected destination overrides automated CAD specialty constraint filter.',
    ],
    isManualOverride: true,
  };
}

export function buildAlgorithmComparison({
  algorithm,
  activeHospital,
  snappedSourceNode,
  weightedGraph,
  isFigure2Mode,
}) {
  if (algorithm !== 'compare' || !activeHospital || !snappedSourceNode) return null;

  const sourceId = snappedSourceNode.id;
  const targetId = activeHospital.nodeId;
  const dRun = dijkstra(weightedGraph, sourceId, targetId);
  const aRun = astar(weightedGraph, sourceId, targetId);
  const dDetails = extractPathDetails(dRun.path, weightedGraph.edges);
  const aDetails = extractPathDetails(aRun.path, weightedGraph.edges);
  const costDelta = Math.abs(dRun.totalCost - aRun.totalCost);

  const formatMetric = (run, details) => ({
    cost: run.totalCost,
    costFormatted: isFigure2Mode ? `${run.totalCost} min` : `${(run.totalCost / 60).toFixed(1)} min`,
    nodesExpanded: run.nodesExpanded,
    queryTimeMs: run.queryTimeMs,
    distanceM: details.totalDistanceM,
    path: run.path,
    success: run.success,
  });

  return {
    dijkstra: formatMetric(dRun, dDetails),
    astar: formatMetric(aRun, aDetails),
    isCostEqual: costDelta < 0.001,
    costDelta,
  };
}
