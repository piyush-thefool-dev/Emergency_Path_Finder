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

    // 2. Route Calculation
    let routeResult;
    if (algorithm === 'astar') {
      routeResult = astar(weightedGraph, sourceNodeId, hospital.nodeId);
    } else {
      // Use multiDijkstra result for fast lookup
      const cost = multiDijkstra.costMap.get(hospital.nodeId);
      const isReached = cost !== undefined && cost < Infinity;
      const path = isReached
        ? dijkstra(weightedGraph, sourceNodeId, hospital.nodeId).path
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

    const isEstimatedAvailability = Boolean(hospital.isSimulatedAvailability || hospital.isUserEditedBedData);

    if (isEstimatedAvailability) {
      warnings.push('[UNVERIFIED BED ESTIMATE] Availability values are simulated or user-entered. Confirm directly with the hospital; do not assume a free bed.');
    } else if (!timestamp) {
      warnings.push('[MISSING DATA] Availability timestamp is missing; contact hospital triage directly.');
    } else if (isStale) {
      warnings.push(`[STALE DATA] Availability record is ${minutesOld}m old (exceeds ${DATA_FRESHNESS_LIMITS.HOSPITAL_STALE_MINUTES}m threshold). Contact the facility to confirm.`);
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
