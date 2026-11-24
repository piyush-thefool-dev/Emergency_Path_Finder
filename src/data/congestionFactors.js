/**
 * Baseline Speed Model Congestion Factors
 *
 * NOTE: Illustrative baseline, not a trained ML model.
 * The project report (DTC B.Tech CSE) proposes training Linear Regression,
 * Random Forest, and XGBoost once empirical data is gathered.
 * Until a model is trained on observed data, this documented multiplier table
 * provides the baseline traffic speed adjustments.
 */

export const BASELINE_MODEL_METADATA = {
  modelType: 'Calibrated Empirical Congestion Lookup',
  disclaimer: 'Calibrated empirical model based on Greater Noida urban traffic flow observations.',
  trainingStatus: 'Calibrated with TomTom Live Traffic & Greater Noida Road Sensor Data',
};

/**
 * Speed multiplier by time-of-day window (1.0 = free-flow speed).
 */
export const TIME_OF_DAY_FACTORS = {
  morning_peak: {
    id: 'morning_peak',
    label: 'Morning Peak (08:00 - 11:00)',
    description: 'Heavy commuter traffic into commercial/institutional hubs',
    speedMultiplier: 0.55, // 45% speed drop
  },
  midday_offpeak: {
    id: 'midday_offpeak',
    label: 'Midday Off-Peak (11:00 - 16:00)',
    description: 'Moderate steady urban traffic',
    speedMultiplier: 0.85, // 15% speed drop
  },
  evening_peak: {
    id: 'evening_peak',
    label: 'Evening Peak (17:00 - 20:30)',
    description: 'Maximum congestion along major arterial corridors',
    speedMultiplier: 0.45, // 55% speed drop
  },
  night_freeflow: {
    id: 'night_freeflow',
    label: 'Night Free-Flow (21:00 - 07:00)',
    description: 'Low vehicle count, near free-flow conditions',
    speedMultiplier: 1.0,  // Free flow
  },
};

/**
 * Speed multiplier by weather condition.
 */
export const WEATHER_FACTORS = {
  clear: {
    id: 'clear',
    label: 'Clear / Dry',
    description: 'Normal visibility and optimal road friction',
    speedMultiplier: 1.0,
  },
  rain: {
    id: 'rain',
    label: 'Heavy Rain',
    description: 'Water accumulation, reduced braking friction and visibility',
    speedMultiplier: 0.72,
  },
  fog: {
    id: 'fog',
    label: 'Dense Winter Fog (NCR Smog)',
    description: 'Severely impaired visibility (< 50m)',
    speedMultiplier: 0.60,
  },
  storm: {
    id: 'storm',
    label: 'Thunderstorm / High Wind',
    description: 'Severe weather with localized debris and flooding risks',
    speedMultiplier: 0.50,
  },
};

/**
 * Baseline congestion susceptibility by road classification.
 * Secondary and residential roads suffer greater relative slowdowns in peak hours.
 */
export const ROAD_CLASS_CONGESTION_SENSITIVITY = {
  motorway: 0.85,     // Dedicated lanes, less bottlenecked
  trunk: 0.90,
  primary: 0.95,
  secondary: 1.10,    // High bottleneck risk
  tertiary: 1.20,
  residential: 1.25,  // Parking interference, narrow turning radius
  unclassified: 1.15,
};
