/**
 * Validation utilities for network topology, road speeds, and graph attributes.
 * Enforces the report constraint: never silently divide by zero or accept implausible values.
 */

import { DEFAULT_SPEED_LIMITS_KPH, SPEED_BOUNDS_KPH } from '../config/constants.js';

/**
 * Validates a speed value in km/h. If invalid, non-positive, NaN, or implausible,
 * applies a documented fallback (speed limit for road class or absolute safe fallback).
 *
 * @param {number|*} speedKph Speed value to validate
 * @param {number} [speedLimitKph] Optional posted speed limit
 * @param {string} [roadType] Road classification
 * @returns {{ validSpeedKph: number, wasFallbackApplied: boolean, reason: string|null }}
 */
export function validateSpeed(speedKph, speedLimitKph, roadType = 'residential') {
  const isNumber = typeof speedKph === 'number' && !Number.isNaN(speedKph) && Number.isFinite(speedKph);

  if (isNumber && speedKph >= SPEED_BOUNDS_KPH.MIN_PLAUSIBLE && speedKph <= SPEED_BOUNDS_KPH.MAX_PLAUSIBLE) {
    return {
      validSpeedKph: speedKph,
      wasFallbackApplied: false,
      reason: null,
    };
  }

  // Determine fallback speed from posted limit or highway type
  let fallback = SPEED_BOUNDS_KPH.ABSOLUTE_FALLBACK;
  let reason = 'Speed missing or non-positive';

  if (typeof speedLimitKph === 'number' && speedLimitKph > 0) {
    fallback = speedLimitKph;
    reason = `Speed value ${speedKph} invalid; fallback to posted limit ${speedLimitKph} km/h`;
  } else if (roadType && DEFAULT_SPEED_LIMITS_KPH[roadType]) {
    fallback = DEFAULT_SPEED_LIMITS_KPH[roadType];
    reason = `Speed value ${speedKph} invalid; fallback to standard ${roadType} limit ${fallback} km/h`;
  } else {
    reason = `Speed value ${speedKph} invalid; fallback to safe default ${fallback} km/h`;
  }

  return {
    validSpeedKph: fallback,
    wasFallbackApplied: true,
    reason,
  };
}

/**
 * Validates an edge object against required routing schema.
 *
 * @param {Object} edge
 * @returns {{ isValid: boolean, errors: Array<string> }}
 */
export function validateEdge(edge) {
  const errors = [];
  if (!edge || typeof edge !== 'object') {
    return { isValid: false, errors: ['Edge must be a non-null object'] };
  }

  if (edge.from === undefined || edge.from === null) errors.push('Edge missing "from" node ID');
  if (edge.to === undefined || edge.to === null) errors.push('Edge missing "to" node ID');
  if (typeof edge.lengthM !== 'number' || edge.lengthM <= 0) errors.push('Edge lengthM must be a positive number');

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates full graph consistency (nodes exist, edges connect valid nodes).
 *
 * @param {Object} graph Graph object containing { nodes, edges }
 * @returns {{ isValid: boolean, warnings: Array<string> }}
 */
export function validateGraph(graph) {
  const warnings = [];
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    return { isValid: false, warnings: ['Graph must include nodes and edges arrays'] };
  }

  const nodeSet = new Set(graph.nodes.map((n) => n.id));

  for (const edge of graph.edges) {
    if (!nodeSet.has(edge.from)) {
      warnings.push(`Edge ${edge.id || 'unnamed'} refers to unknown from-node: ${edge.from}`);
    }
    if (!nodeSet.has(edge.to)) {
      warnings.push(`Edge ${edge.id || 'unnamed'} refers to unknown to-node: ${edge.to}`);
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
