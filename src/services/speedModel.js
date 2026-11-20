/**
 * Baseline Speed Prediction Model Service.
 *
 * NOTE: Illustrative baseline, not a trained ML model.
 * In accordance with the DTC B.Tech project specifications, this module implements
 * an open, deterministic congestion multiplier table over posted free-flow speeds.
 * It is NOT an empirical or trained machine learning model.
 */

import {
  TIME_OF_DAY_FACTORS,
  WEATHER_FACTORS,
  ROAD_CLASS_CONGESTION_SENSITIVITY,
} from '../data/congestionFactors.js';
import { validateSpeed } from '../utils/validators.js';

/**
 * Predicts the traversable vehicle speed in km/h for a road segment
 * under contextual weather and time-of-day scenarios.
 *
 * @param {Object} edge Edge object with speedLimitKph, roadType, lanes
 * @param {string} [timeOfDayId='morning_peak'] Time of day key
 * @param {string} [weatherId='clear'] Weather condition key
 * @returns {{
 *   predictedSpeedKph: number,
 *   freeFlowSpeedKph: number,
 *   congestionMultiplier: number,
 *   wasFallbackApplied: boolean,
 *   modelLabel: string
 * }}
 */
export function predictSegmentSpeed(edge, timeOfDayId = 'morning_peak', weatherId = 'clear') {
  const roadType = edge.roadType || 'residential';
  const speedLimit = edge.speedLimitKph || 40;

  // Validate free-flow baseline speed
  const speedValidation = validateSpeed(speedLimit, speedLimit, roadType);
  const freeFlowSpeedKph = speedValidation.validSpeedKph;

  // Contextual factors
  const timeFactor = TIME_OF_DAY_FACTORS[timeOfDayId]?.speedMultiplier ?? 0.75;
  const weatherFactor = WEATHER_FACTORS[weatherId]?.speedMultiplier ?? 1.0;
  const sensitivity = ROAD_CLASS_CONGESTION_SENSITIVITY[roadType] ?? 1.0;

  // Aggregate multiplier (sensitive roads drop further during congestion)
  // For time factors < 1.0, sensitivity > 1.0 amplifies the slowdown
  const netTimeMultiplier = timeFactor < 1.0
    ? Math.max(0.2, 1.0 - (1.0 - timeFactor) * sensitivity)
    : 1.0;

  const totalMultiplier = Number((netTimeMultiplier * weatherFactor).toFixed(3));
  const rawPredicted = freeFlowSpeedKph * totalMultiplier;

  // Re-validate final speed to avoid zero or implausible values
  const finalValidation = validateSpeed(rawPredicted, freeFlowSpeedKph, roadType);

  return {
    predictedSpeedKph: Number(finalValidation.validSpeedKph.toFixed(1)),
    freeFlowSpeedKph,
    congestionMultiplier: totalMultiplier,
    wasFallbackApplied: speedValidation.wasFallbackApplied || finalValidation.wasFallbackApplied,
    modelLabel: 'Illustrative baseline, not a trained ML model',
  };
}
