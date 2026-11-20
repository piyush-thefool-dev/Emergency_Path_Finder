/**
 * Heuristic functions for A* search.
 *
 * Implements the travel-time lower-bound heuristic specified in the report:
 *   h(n) = straight_line_distance(n, target) / max_speed_upper_bound
 *
 * Admissibility Guarantee:
 *   By the triangle inequality on a spherical surface, straight-line (Haversine)
 *   distance <= any road path distance.
 *   Because max_speed_upper_bound >= speed on any traversable road segment,
 *   h(n) = dist / max_speed <= road_dist / road_speed = actual_remaining_time.
 *   Therefore h(n) is strictly admissible and consistent (monotonic).
 *   If a valid speed bound cannot be established, h(n) safely falls back to 0,
 *   reducing A* to Dijkstra's ordering without losing optimality.
 */

import { haversineDistance, kphToMps } from '../utils/geo.js';

/**
 * Computes the maximum plausible speed in metres per second across all traversable edges in the graph.
 *
 * @param {Array<Object>} edges Array of edge objects
 * @returns {number} Maximum speed in m/s (or 0 if invalid)
 */
export function computeMaxSpeedMps(edges) {
  if (!Array.isArray(edges) || edges.length === 0) return 0;

  let maxKph = 0;
  for (const edge of edges) {
    if (edge.closed) continue; // Exclude inaccessible roads
    const edgeSpeed = edge.effectiveSpeedKph || edge.speedLimitKph || 0;
    if (edgeSpeed > maxKph) {
      maxKph = edgeSpeed;
    }
  }

  return kphToMps(maxKph);
}

/**
 * Factory that creates an admissible A* travel-time heuristic function for a specific target node.
 *
 * @param {Object} targetNode Destination node with { id, lat, lon }
 * @param {number} maxSpeedMps Maximum network speed upper bound in m/s
 * @param {string} [unit='seconds'] Unit of travel time: 'seconds' or 'minutes'
 * @returns {function(Object): number} Heuristic function returning lower-bound travel time
 */
export function createTravelTimeHeuristic(targetNode, maxSpeedMps, unit = 'seconds') {
  if (!targetNode || typeof targetNode.lat !== 'number' || typeof targetNode.lon !== 'number' || maxSpeedMps <= 0) {
    // Admissible fallback: h(n) = 0 reduces A* to Dijkstra
    return () => 0;
  }

  const timeDivisor = unit === 'minutes' ? maxSpeedMps * 60 : maxSpeedMps;

  return function heuristic(currentNode) {
    if (!currentNode || typeof currentNode.lat !== 'number' || typeof currentNode.lon !== 'number') {
      return 0;
    }
    if (currentNode.id === targetNode.id) {
      return 0;
    }

    const distanceMetres = haversineDistance(
      currentNode.lat,
      currentNode.lon,
      targetNode.lat,
      targetNode.lon
    );

    // Straight line distance / upper bound speed
    const lowerBoundTime = distanceMetres / timeDivisor;
    return Math.max(0, lowerBoundTime);
  };
}
