/**
 * Road condition levels that anyone (public or ambulance driver) can report.
 *
 * `closed` levels block the road for routing. The others slow it by `factor`.
 * Colours follow the usual traffic-map habit: yellow = slow, orange = heavy,
 * red = blocked. The route line itself stays red with a white outline.
 */
export const TRAFFIC_LEVELS = {
  moderate: {
    id: 'moderate',
    label: 'Slow traffic',
    short: 'Slow',
    color: '#EAB308',
    factor: 2,
    closed: false,
    symbol: '!',
    hint: 'Moving, but about 2x slower',
  },
  heavy: {
    id: 'heavy',
    label: 'Heavy congestion',
    short: 'Heavy',
    color: '#EA580C',
    factor: 4,
    closed: false,
    symbol: '!!',
    hint: 'Crawling, about 4x slower',
  },
  accident: {
    id: 'accident',
    label: 'Accident',
    short: 'Accident',
    color: '#9333EA',
    factor: 1,
    closed: true,
    symbol: '✕',
    hint: 'Road blocked by a crash',
  },
  closure: {
    id: 'closure',
    label: 'Road closed',
    short: 'Closed',
    color: '#DC2626',
    factor: 1,
    closed: true,
    symbol: '✕',
    hint: 'Nothing can pass',
  },
};

export const TRAFFIC_LEVEL_LIST = Object.values(TRAFFIC_LEVELS);

export const REPORTERS = ['Public', 'Ambulance driver'];

/** Old code passed 'congestion' for the 4x slowdown. Keep that working. */
export function resolveLevel(type) {
  if (type === 'congestion') return TRAFFIC_LEVELS.heavy;
  return TRAFFIC_LEVELS[type] || TRAFFIC_LEVELS.closure;
}

/** Works out the level of a stored incident, including older ones without `kind`. */
export function levelOfIncident(incident) {
  if (!incident) return null;
  if (incident.kind && TRAFFIC_LEVELS[incident.kind]) return TRAFFIC_LEVELS[incident.kind];
  if (incident.closed) return TRAFFIC_LEVELS.closure;
  if (incident.slowdownFactor >= 3) return TRAFFIC_LEVELS.heavy;
  if (incident.slowdownFactor > 1) return TRAFFIC_LEVELS.moderate;
  return null;
}
