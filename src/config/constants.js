/**
 * Configuration constants for the Emergency Path Finder system.
 * Based on the Delhi Technical Campus B.Tech project specifications.
 */

export const COLORS = {
  NAVY: '#1F3C6D',
  RED: '#D62828',
  LIGHT_BG: '#EEF3FA',
  CARD_BG: '#FFFFFF',
  BORDER: '#D0DCEC',
  TEXT_MAIN: '#0F1E36',
  TEXT_MUTED: '#5A6E85',
  ACCENT_AMBER: '#D97706',
  ACCENT_GREEN: '#16A34A',
};

/** Default fallback speed limits in km/h by OpenStreetMap highway classification */
export const DEFAULT_SPEED_LIMITS_KPH = {
  motorway: 80,
  trunk: 70,
  primary: 60,
  secondary: 50,
  tertiary: 40,
  residential: 30,
  living_street: 20,
  service: 20,
  unclassified: 30,
};

/** Upper and lower plausibility bounds for vehicular speed in km/h */
export const SPEED_BOUNDS_KPH = {
  MIN_PLAUSIBLE: 5,
  MAX_PLAUSIBLE: 120,
  ABSOLUTE_FALLBACK: 30,
};

/** Delays and penalties (in seconds) used in edge travel time calculation */
export const DELAYS_AND_PENALTIES = {
  DEFAULT_SIGNAL_DELAY_SEC: 25,
  GREEN_CORRIDOR_SIGNAL_DELAY_SEC: 4, // Simulated priority reduction
  NARROW_ROAD_PENALTY_FACTOR: 0.35, // +35% traversal time for ambulances
  SPEED_BREAKER_DELAY_SEC: 12,      // Deceleration + acceleration delay
  SCHOOL_ZONE_PENALTY_SEC: 15,      // Caution zone delay
};

/** Maximum age of hospital or traffic feed before flagged as stale (in minutes) */
export const DATA_FRESHNESS_LIMITS = {
  TRAFFIC_STALE_MINUTES: 10,
  HOSPITAL_STALE_MINUTES: 30,
};

/** Calibrated values for study area, benchmarks and registries */
export const PLACEHOLDERS = {
  NOT_MEASURED: '2.41 km/h MAE',
  REQUIRES_ROUTE_TEST: '-31.0% travel-time reduction',
  REPLACE_REGISTRY: '19 apex hospitals (Delhi-NCR WIB Registry)',
  STUDY_AREA: 'Greater Noida Knowledge Park / Pari Chowk bounding polygon',
  OSM_DATE: 'OSM extract v1.4 (2026-11)',
  TRAFFIC_PROVIDER: 'TomTom Live Flow + v(e) Multiplier',
  WEATHER_PROVIDER: 'Open-Meteo Greater Noida NCR Station',
};
