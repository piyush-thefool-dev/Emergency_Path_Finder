/**
 * Edge travel-time calculation and ambulance suitability scoring.
 *
 * Implements the fundamental edge cost formula from the project report:
 *   t(e) = L(e) / v(e)
 *
 * where:
 *   L(e) is segment length in metres
 *   v(e) is predicted vehicle speed in metres/second (converted from km/h)
 *
 * Delays and Penalties:
 *   - Signal wait: Non-negative delay at signalized intersections.
 *   - Green corridor simulation: Reducible when authorized signal-priority is enabled.
 *   - Road suitability penalties: Narrow lanes, speed breakers, school zones.
 *   - Hard prohibitions: Closed or access-restricted roads are marked weight = Infinity (inaccessible).
 *   - Never silently divides by zero.
 */

import { DELAYS_AND_PENALTIES } from '../config/constants.js';
import { kphToMps } from '../utils/geo.js';
import { predictSegmentSpeed } from './speedModel.js';
import { resolveIncidentForEdge } from '../utils/incidents.js';

/**
 * Calculates the travel time (in seconds) and suitability metadata for a single road edge.
 *
 * @param {Object} edge Road segment edge object
 * @param {Object} options Calculation configuration
 * @param {string} [options.timeOfDay='morning_peak']
 * @param {string} [options.weather='clear']
 * @param {boolean} [options.signalPriorityEnabled=false]
 * @param {Map<string, Object>} [options.incidents] Map of edgeId -> incident modifier { closed, factor }
 * @returns {{
 *   travelTimeSec: number,
 *   effectiveSpeedKph: number,
 *   lengthM: number,
 *   signalDelaySec: number,
 *   suitabilityPenaltiesSec: number,
 *   isClosed: boolean,
 *   needsHumanReview: boolean,
 *   reviewReasons: Array<string>
 * }}
 */
export function calculateEdgeWeight(edge, options = {}) {
  const {
    timeOfDay = 'morning_peak',
    weather = 'clear',
    signalPriorityEnabled = false,
    incidents = null,
  } = options;

  const reviewReasons = [];

  // Check hard road closure or incident closure (matching either direct edge ID or paired bidirectional edge)
  const incident = resolveIncidentForEdge(edge.id, incidents);
  const isClosed = Boolean(edge.closed || incident?.closed);

  if (isClosed) {
    return {
      travelTimeSec: Infinity,
      effectiveSpeedKph: 0,
      lengthM: edge.lengthM || 0,
      signalDelaySec: 0,
      suitabilityPenaltiesSec: 0,
      isClosed: true,
      needsHumanReview: false,
      reviewReasons: ['Road closed by incident or administrative order'],
    };
  }

  // 1. Predict baseline vehicular speed under scenario
  const speedPrediction = predictSegmentSpeed(edge, timeOfDay, weather);
  let effectiveSpeedKph = speedPrediction.predictedSpeedKph;

  // Apply incident slowdown factor if present
  if (incident?.slowdownFactor && incident.slowdownFactor > 0) {
    effectiveSpeedKph = Math.max(5, effectiveSpeedKph / incident.slowdownFactor);
  }

  // Convert speed to m/s: v(m/s) = v(km/h) * 1000 / 3600
  const speedMps = kphToMps(effectiveSpeedKph);

  // Safeguard: Never divide by zero
  if (speedMps <= 0) {
    return {
      travelTimeSec: Infinity,
      effectiveSpeedKph: 0,
      lengthM: edge.lengthM || 0,
      signalDelaySec: 0,
      suitabilityPenaltiesSec: 0,
      isClosed: true,
      needsHumanReview: true,
      reviewReasons: ['Vehicle speed calculated as zero or non-positive; edge marked unavailable'],
    };
  }

  // 2. Pure traversal time: t = L / v
  const lengthM = edge.lengthM || 100;
  let baseTravelTimeSec = lengthM / speedMps;

  // 3. Signalized intersection delay
  let signalDelaySec = 0;
  if (edge.hasSignal) {
    signalDelaySec = signalPriorityEnabled
      ? DELAYS_AND_PENALTIES.GREEN_CORRIDOR_SIGNAL_DELAY_SEC
      : DELAYS_AND_PENALTIES.DEFAULT_SIGNAL_DELAY_SEC;
  }

  // 4. Ambulance suitability penalties
  let suitabilityPenaltiesSec = 0;

  if (edge.isNarrow) {
    // Narrow street restricts emergency vehicle overtaking
    const narrowPenalty = baseTravelTimeSec * DELAYS_AND_PENALTIES.NARROW_ROAD_PENALTY_FACTOR;
    suitabilityPenaltiesSec += narrowPenalty;
  }

  if (edge.hasSpeedBreaker) {
    // Speed breaker causes emergency braking and patient discomfort
    suitabilityPenaltiesSec += DELAYS_AND_PENALTIES.SPEED_BREAKER_DELAY_SEC;
  }

  if (edge.inSchoolZone) {
    suitabilityPenaltiesSec += DELAYS_AND_PENALTIES.SCHOOL_ZONE_PENALTY_SEC;
  }

  // Check for unknown or missing road attributes requiring human review
  if (edge.roadType === undefined || edge.roadType === 'unclassified') {
    reviewReasons.push('Road classification unverified in OpenStreetMap extract');
  }
  if (edge.lanes === undefined || edge.lanes === null) {
    reviewReasons.push('Lane count missing');
  }

  const needsHumanReview = reviewReasons.length > 0;
  const totalTravelTimeSec = Number((baseTravelTimeSec + signalDelaySec + suitabilityPenaltiesSec).toFixed(2));

  return {
    travelTimeSec: totalTravelTimeSec,
    effectiveSpeedKph,
    lengthM,
    signalDelaySec,
    suitabilityPenaltiesSec: Number(suitabilityPenaltiesSec.toFixed(2)),
    isClosed: false,
    needsHumanReview,
    reviewReasons,
  };
}

/**
 * Hydrates an entire graph's edges with computed travel-time weights.
 *
 * @param {Object} graph Graph object { nodes, edges }
 * @param {Object} options Calculation configuration
 * @returns {Object} New graph object with weighted edges
 */
export function computeGraphWeights(graph, options = {}) {
  if (!graph || !Array.isArray(graph.edges)) return graph;

  // If graph specifies fixed manual weights (e.g. Figure 2 in minutes), preserve them
  if (graph.isSchematic) {
    const weightedEdges = graph.edges.map((edge) => {
      const incident = resolveIncidentForEdge(edge.id, options.incidents);
      const isClosed = Boolean(edge.closed || incident?.closed);
      let weight = edge.weightMinutes;
      if (incident?.slowdownFactor) {
        weight = weight * incident.slowdownFactor;
      }
      return {
        ...edge,
        weight: isClosed ? Infinity : weight,
        closed: isClosed,
        effectiveSpeedKph: edge.speedLimitKph || 50,
      };
    });

    return {
      ...graph,
      edges: weightedEdges,
    };
  }

  const weightedEdges = graph.edges.map((edge) => {
    const result = calculateEdgeWeight(edge, options);
    return {
      ...edge,
      weight: result.travelTimeSec, // Weight in seconds
      travelTimeSec: result.travelTimeSec,
      effectiveSpeedKph: result.effectiveSpeedKph,
      signalDelaySec: result.signalDelaySec,
      suitabilityPenaltiesSec: result.suitabilityPenaltiesSec,
      closed: result.isClosed,
      needsHumanReview: result.needsHumanReview,
      reviewReasons: result.reviewReasons,
    };
  });

  return {
    ...graph,
    edges: weightedEdges,
  };
}
