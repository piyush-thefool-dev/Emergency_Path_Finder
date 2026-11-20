/**
 * Time formatting and freshness validation utilities.
 */

/**
 * Converts seconds to minutes with given decimal precision.
 *
 * @param {number} seconds
 * @param {number} decimals
 * @returns {number}
 */
export function secondsToMinutes(seconds, decimals = 1) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds) || seconds < 0) {
    return 0;
  }
  const factor = Math.pow(10, decimals);
  return Math.round((seconds / 60) * factor) / factor;
}

/**
 * Formats a duration in seconds into a clean human-readable string.
 *
 * @param {number} seconds
 * @returns {string} E.g., "9 min 12 s" or "45 s"
 */
export function formatDuration(seconds) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds) || seconds < 0) {
    return '0 s';
  }
  const totalSec = Math.round(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;

  if (mins === 0) return `${secs} s`;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs} s`;
}

/**
 * Checks if a timestamp exceeds a given age threshold in minutes.
 *
 * @param {string|number|Date} timestamp
 * @param {number} maxMinutes
 * @returns {boolean} True if data is older than maxMinutes or timestamp is missing
 */
export function isDataStale(timestamp, maxMinutes) {
  if (!timestamp) return true;
  const timeMs = new Date(timestamp).getTime();
  if (Number.isNaN(timeMs)) return true;

  const nowMs = Date.now();
  const diffMinutes = (nowMs - timeMs) / (1000 * 60);
  return diffMinutes > maxMinutes;
}

/**
 * Calculates minutes elapsed since the timestamp.
 *
 * @param {string|number|Date} timestamp
 * @returns {number} Minutes elapsed
 */
export function getMinutesElapsed(timestamp) {
  if (!timestamp) return Infinity;
  const timeMs = new Date(timestamp).getTime();
  if (Number.isNaN(timeMs)) return Infinity;
  return Math.max(0, Math.round((Date.now() - timeMs) / (1000 * 60)));
}

/**
 * Formats an ISO string or Date into a standard dispatch timestamp display.
 *
 * @param {string|number|Date} timestamp
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return 'Timestamp missing';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Invalid date';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Short ETA for tight mobile UI, e.g. "4 min" or "1 h 05 min".
 * Rounds up so the displayed ETA is never optimistic.
 */
export function formatEtaShort(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '—';
  const totalMin = Math.max(1, Math.ceil(seconds / 60));
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h} h ${String(m).padStart(2, '0')} min`;
}
