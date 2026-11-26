/**
 * Constrained Hospital Selection and Ranking Service.
 *
 * Implements multi-criteria clinical constraint routing:
 *   1. Clinical specialty constraint filtering (e.g. Trauma, Cardiac, Burn Unit).
 *   2. Physical road travel-time calculations via A* / Dijkstra.
 *   3. Combined Seat/Bed Intake Readiness optimization: combines physical road ETA
 *      with real-time seat availability to prioritize hospitals with both fast road access
 *      and ready ICU/ward capacity.
 */

import { EMERGENCY_CATEGORIES } from '../config/emergencyCategories.js';
import { DATA_FRESHNESS_LIMITS } from '../config/constants.js';
import { dijkstra } from '../algorithms/dijkstra.js';
import { astar } from '../algorithms/astar.js';
import { extractPathDetails } from '../algorithms/pathUtils.js';
import { isDataStale, getMinutesElapsed } from '../utils/time.js';
import { findNearestNode, haversineDistance } from '../utils/geo.js';
import { OSM_GREATER_NOIDA_POIS } from '../data/osmRegionalPois.js';

/**
 * Calculates a seat/bed intake readiness factor and penalty (in seconds)
 * based on live bed counts, triage specialization, and capacity status.
 *
 * @param {Object} availability Hospital bedAvailability record
 * @param {string} requiredSpecialty E.g. 'trauma_center', 'cardiology', 'general_emergency'
 * @returns {{
 *   seatPenaltySec: number,
 *   seatReadinessLevel: 'OPTIMAL' | 'MODERATE' | 'BOTTLENECK' | 'CRITICAL',
 *   seatReadinessLabel: string,
 *   availableSeatsCount: number,
 * }}
 */
export function calculateSeatIntakeFactor(availability = {}, requiredSpecialty = 'trauma_center') {
  const icu = availability.icuBedsFree ?? 0;
  const ward = availability.emergencyWardFree ?? 0;
  const trauma = availability.traumaBedsFree ?? 0;
  const status = availability.status || 'AVAILABLE';

  const availableSeatsCount = icu + ward + trauma;

  // 1. Full capacity / Diversion block
  if (status === 'FULL' || (icu === 0 && ward === 0)) {
    return {
      seatPenaltySec: 900, // +15 min ambulance ramp delay / divert
      seatReadinessLevel: 'CRITICAL',
      seatReadinessLabel: 'Zero Free Beds (High Diversion Risk)',
      availableSeatsCount,
    };
  }

  // 2. High-Acuity ICU/Trauma requirement (Trauma, Cardiac, Burns)
  if (
    requiredSpecialty === 'trauma_center' ||
    requiredSpecialty === 'cardiology' ||
    requiredSpecialty === 'burn_unit'
  ) {
    if (icu === 0) {
      return {
        seatPenaltySec: 420, // +7 min ICU transfer/intake delay
        seatReadinessLevel: 'CRITICAL',
        seatReadinessLabel: 'ICU Full (Call Desk to Confirm)',
        availableSeatsCount,
      };
    }
    if (icu <= 1 || status === 'CRITICAL') {
      return {
        seatPenaltySec: 150, // +2.5 min triage bottleneck
        seatReadinessLevel: 'BOTTLENECK',
        seatReadinessLabel: 'Limited ICU (1 Bed Remaining)',
        availableSeatsCount,
      };
    }
    if (icu >= 4) {
      return {
        seatPenaltySec: -60, // Fast-track immediate bed readiness bonus (-1 min)
        seatReadinessLevel: 'OPTIMAL',
        seatReadinessLabel: `Ready Intake (${icu} ICU Beds Free)`,
        availableSeatsCount,
      };
    }
    return {
      seatPenaltySec: 0,
      seatReadinessLevel: 'MODERATE',
      seatReadinessLabel: `Moderate Capacity (${icu} ICU Beds Free)`,
      availableSeatsCount,
    };
  }

  // 3. General Emergency / Daycare / Observation requirement
  if (ward === 0) {
    return {
      seatPenaltySec: 300,
      seatReadinessLevel: 'CRITICAL',
      seatReadinessLabel: 'Ward Full (Confirm Placement)',
      availableSeatsCount,
    };
  }
  if (ward <= 2) {
    return {
      seatPenaltySec: 90,
      seatReadinessLevel: 'BOTTLENECK',
      seatReadinessLabel: 'Ward Limited (1-2 Seats Free)',
      availableSeatsCount,
    };
  }
  if (ward >= 8) {
    return {
      seatPenaltySec: -45,
      seatReadinessLevel: 'OPTIMAL',
      seatReadinessLabel: `Ready Intake (${ward} Seats/Beds Free)`,
      availableSeatsCount,
    };
  }

  return {
    seatPenaltySec: 0,
    seatReadinessLevel: 'MODERATE',
    seatReadinessLabel: `Moderate Capacity (${ward} Seats Free)`,
    availableSeatsCount,
  };
}

/**
 * Filters and ranks candidate hospitals from the ambulance source node.
 *
 * @param {Array<Object>} hospitals Array of hospital objects
 * @param {string|number} sourceNodeId Current road network node of ambulance
 * @param {Object} weightedGraph Graph with precomputed travel-time edge weights
 * @param {string} [emergencyCategoryKey='TRAUMA'] Category from EMERGENCY_CATEGORIES
 * @param {string} [algorithm='astar'] 'dijkstra' or 'astar'
 * @returns {{
 *   rankedHospitals: Array<Object>,
 *   bestRecommendation: Object|null,
 *   alternateCandidates: Array<Object>,
 *   filteredOutCount: number,
 *   unreachableCount: number
 * }}
 */
export function rankHospitalsForEmergency(
  hospitals,
  sourceNodeId,
  weightedGraph,
  emergencyCategoryKey = 'TRAUMA',
  algorithm = 'astar'
) {
  if (!Array.isArray(hospitals) || hospitals.length === 0 || !sourceNodeId || !weightedGraph) {
    return {
      rankedHospitals: [],
      bestRecommendation: null,
      alternateCandidates: [],
      filteredOutCount: 0,
      unreachableCount: 0,
    };
  }

  const categoryConfig = EMERGENCY_CATEGORIES[emergencyCategoryKey] || EMERGENCY_CATEGORIES.GENERAL;
  const requiredSpecialty = categoryConfig.requiredSpecialty;

  let filteredOutCount = 0;
  let unreachableCount = 0;
  const evaluatedHospitals = [];

  // Single-source Dijkstra can compute costs to all reachable nodes in one pass if using dijkstra
  const multiDijkstra = dijkstra(weightedGraph, sourceNodeId, null);

  for (const hospital of hospitals) {
    // 1. Specialty Constraint Check
    const hasSpecialty = Array.isArray(hospital.specialties) &&
      hospital.specialties.includes(requiredSpecialty);

    if (!hasSpecialty) {
      filteredOutCount++;
      continue;
    }

    // 2. Target Node ID Resolution & Route Calculation
    const hasNode = weightedGraph.nodes.some((n) => n.id === hospital.nodeId);
    const targetNodeId = hasNode
      ? hospital.nodeId
      : (findNearestNode(hospital.lat, hospital.lon, weightedGraph.nodes)?.id || hospital.nodeId);

    let routeResult;
    if (algorithm === 'astar') {
      routeResult = astar(weightedGraph, sourceNodeId, targetNodeId);
    } else {
      // Use multiDijkstra result for fast lookup
      const cost = multiDijkstra.costMap.get(targetNodeId);
      const isReached = cost !== undefined && cost < Infinity;
      const path = isReached
        ? dijkstra(weightedGraph, sourceNodeId, targetNodeId).path
        : [];
      routeResult = {
        path,
        totalCost: isReached ? cost : Infinity,
        nodesExpanded: multiDijkstra.nodesExpanded,
        queryTimeMs: multiDijkstra.queryTimeMs,
        success: isReached && path.length > 0,
      };
    }

    if (!routeResult.success || routeResult.totalCost === Infinity) {
      unreachableCount++;
      continue;
    }

    // 3. Extract physical route distance & edge details
    const { pathEdges, totalDistanceM } = extractPathDetails(routeResult.path, weightedGraph.edges);

    // 4. Data Freshness and Availability Validation
    const warnings = [];
    const availability = hospital.bedAvailability || {};
    const timestamp = availability.lastUpdated;
    const isStale = isDataStale(timestamp, DATA_FRESHNESS_LIMITS.HOSPITAL_STALE_MINUTES);
    const minutesOld = getMinutesElapsed(timestamp);
    const isEstimatedAvailability = Boolean(hospital.isSimulatedAvailability);

    if (hospital.isUserEditedBedData) {
      warnings.push('[MANUAL OVERRIDE] Capacity calibrated manually by emergency dispatch operator.');
    } else if (!timestamp) {
      warnings.push('[REGISTRY DATA] Availability record awaiting next scheduled telemetry ping.');
    } else if (isStale) {
      warnings.push(`[TELEMETRY NOTICE] Availability record is ${minutesOld}m old (exceeds ${DATA_FRESHNESS_LIMITS.HOSPITAL_STALE_MINUTES}m threshold).`);
    }

    if (availability.status === 'CRITICAL' || availability.status === 'UNVERIFIED') {
      warnings.push(`Capacity status is ${availability.status}. Diversion risk.`);
    }

    // Check for road suitability flags along the path
    const reviewEdges = pathEdges.filter((e) => e.needsHumanReview);
    if (reviewEdges.length > 0) {
      warnings.push(`Route traverses ${reviewEdges.length} segment(s) with unverified road attributes (needs human review).`);
    }

    // Compute seat & bed intake readiness factor
    const seatFactor = calculateSeatIntakeFactor(availability, requiredSpecialty);
    const compositeScore = Math.max(1, Number((routeResult.totalCost + seatFactor.seatPenaltySec).toFixed(1)));

    evaluatedHospitals.push({
      ...hospital,
      targetNodeId,
      travelTimeSec: routeResult.totalCost,
      travelTimeMin: Number((routeResult.totalCost / 60).toFixed(1)),
      distanceM: totalDistanceM,
      pathNodeIds: routeResult.path,
      pathEdges,
      nodesExpanded: routeResult.nodesExpanded,
      queryTimeMs: routeResult.queryTimeMs,
      seatPenaltySec: seatFactor.seatPenaltySec,
      seatReadinessLevel: seatFactor.seatReadinessLevel,
      seatReadinessLabel: seatFactor.seatReadinessLabel,
      availableSeatsCount: seatFactor.availableSeatsCount,
      compositeScore,
      warnings,
      isFresh: !isEstimatedAvailability && !isStale && Boolean(timestamp),
      minutesOld,
    });
  }

  // Combined Ranking: Composite Optimization Score (Road Travel Time + Seat/Bed Readiness)
  evaluatedHospitals.sort((a, b) => {
    // 1. Primary: Combined Composite Score (Road driving time + seat availability adjustment)
    if (Math.abs(a.compositeScore - b.compositeScore) > 1) {
      return a.compositeScore - b.compositeScore;
    }
    // 2. Secondary: Raw shortest physical road travel time
    if (a.travelTimeSec !== b.travelTimeSec) {
      return a.travelTimeSec - b.travelTimeSec;
    }
    // 3. Tertiary: Highest available seat/bed count
    if (a.availableSeatsCount !== b.availableSeatsCount) {
      return b.availableSeatsCount - a.availableSeatsCount;
    }
    // 4. Quaternary: Availability record freshness
    if (a.isFresh && !b.isFresh) return -1;
    if (!a.isFresh && b.isFresh) return 1;
    // 5. Quaternary: Physical road distance
    return a.distanceM - b.distanceM;
  });

  const bestRecommendation = evaluatedHospitals.length > 0 ? evaluatedHospitals[0] : null;
  const alternateCandidates = evaluatedHospitals.length > 1 ? evaluatedHospitals.slice(1) : [];

  return {
    rankedHospitals: evaluatedHospitals,
    bestRecommendation,
    alternateCandidates,
    filteredOutCount,
    unreachableCount,
  };
}

/**
 * Transitions hospital selection + lock state across user and telemetry events.
 * When locked, ambulance movement, category changes, and map recentering never
 * revert the chosen hospital back to the closest automatic facility.
 */
export function resolveHospitalSelectionOnEvent(state = {}, event = {}) {
  const {
    selectedHospitalId = null,
    isHospitalLocked = false,
    activeHospitalId = null,
  } = state;

  switch (event.type) {
    case 'SELECT_HOSPITAL': {
      const nextId = event.hospitalId || null;
      if (!nextId) {
        return { selectedHospitalId: null, isHospitalLocked: false };
      }
      return { selectedHospitalId: nextId, isHospitalLocked };
    }
    case 'TOGGLE_LOCK': {
      if (isHospitalLocked) {
        return { selectedHospitalId: null, isHospitalLocked: false };
      }
      const targetId = selectedHospitalId || activeHospitalId || null;
      return {
        selectedHospitalId: targetId,
        isHospitalLocked: Boolean(targetId),
      };
    }
    case 'AMBULANCE_MOVED':
    case 'CATEGORY_CHANGED':
    case 'RECENTER': {
      if (isHospitalLocked) {
        return { selectedHospitalId, isHospitalLocked: true };
      }
      return { selectedHospitalId: null, isHospitalLocked: false };
    }
    default:
      return { selectedHospitalId, isHospitalLocked };
  }
}

/**
 * Ensures a selected/locked destination outside the radius tier still renders on the map.
 */
export function ensureActiveHospitalInList(hospitals = [], activeHospital = null) {
  const list = Array.isArray(hospitals) ? hospitals : [];
  if (!activeHospital?.id) return list;
  if (list.some((h) => h.id === activeHospital.id)) return list;
  return [activeHospital, ...list];
}

/**
 * Builds the complete map-marker list by starting from the active/ranked dispatch targets
 * and overlaying local corridor hospitals plus supplemental OpenStreetMap hospital POIs
 * strictly within the active search radius (`radiusKm`, matching the dashed blue circle)
 * when `radiusKm > 0`. An explicitly active/locked target outside the ring is still kept.
 */
export function buildMapHospitalMarkers({
  topHospitals = [],
  availableHospitals = [],
  activeHospital = null,
  ambulancePos = null,
  radiusKm = 10,
} = {}) {
  const hasBoundedRadius = Number.isFinite(radiusKm) && radiusKm > 0;
  const maxLocalRadiusM = hasBoundedRadius ? radiusKm * 1000 : Infinity;

  const isInsideRadius = (hosp) => {
    if (!hasBoundedRadius || !ambulancePos) return true;
    if (!Number.isFinite(ambulancePos.lat) || !Number.isFinite(ambulancePos.lon)) return true;
    return haversineDistance(ambulancePos.lat, ambulancePos.lon, hosp.lat, hosp.lon) <= maxLocalRadiusM;
  };

  const result = ensureActiveHospitalInList([], activeHospital);
  const seenIds = new Set(result.map((h) => h.id));

  const isTooCloseToExisting = (candidate) =>
    result.some(
      (existing) =>
        haversineDistance(existing.lat, existing.lon, candidate.lat, candidate.lon) < 60
    );

  const appendIfWithinRadius = (candidates, enforceDedupeDistance = true) => {
    for (const hosp of candidates) {
      if (!hosp?.id || seenIds.has(hosp.id)) continue;
      if (!isInsideRadius(hosp)) continue;
      if (enforceDedupeDistance && isTooCloseToExisting(hosp)) continue;
      seenIds.add(hosp.id);
      result.push(hosp);
    }
  };

  appendIfWithinRadius(Array.isArray(topHospitals) ? topHospitals : [], false);

  const baseCandidates = Array.isArray(availableHospitals)
    ? ambulancePos
      ? availableHospitals
      : availableHospitals.slice(0, 12)
    : [];

  appendIfWithinRadius(baseCandidates, true);
  appendIfWithinRadius(OSM_GREATER_NOIDA_POIS, true);
  return result;
}

/**
 * Decides whether a resolved route should divert the ambulance to another candidate
 * hospital instead of forcing the blocked/heavily degraded corridor:
 * - Never diverts when the dispatcher locked the current hospital.
 * - Diverts immediately when all road detours failed (`status === 'blocked'`).
 * - Diverts when multiple closures (`closedCount >= 2`) impose a major delay over baseline.
 */
export function shouldSwitchHospitalForRoute(telemetry, baseHospital, isHospitalLocked = false) {
  if (!telemetry?.hospitalId || isHospitalLocked) return false;
  if (telemetry.status === 'blocked') return true;
  if ((telemetry.closedCount || 0) >= 2 && Number.isFinite(telemetry.durationSec)) {
    const baseSec = baseHospital?.travelTimeSec || 0;
    if (baseSec > 0 && telemetry.durationSec >= Math.max(baseSec * 1.65, baseSec + 180)) {
      return true;
    }
  }
  return false;
}

/**
 * Excludes blocked candidate hospital IDs while always preserving at least one fallback entry.
 */
export function filterBlockedHospitals(rankedList = [], blockedIds = []) {
  const list = Array.isArray(rankedList) ? rankedList : [];
  if (list.length === 0 || !Array.isArray(blockedIds) || blockedIds.length === 0) return list;
  const blocked = new Set(blockedIds);
  const remaining = list.filter((h) => !blocked.has(h.id));
  if (remaining.length > 0) return remaining;
  // All candidates blocked: keep the last blocked candidate as final manual fallback
  const lastBlockedId = blockedIds[blockedIds.length - 1];
  const fallback = list.find((h) => h.id === lastBlockedId) || list[list.length - 1];
  return fallback ? [fallback] : list;
}
