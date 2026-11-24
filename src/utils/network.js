/**
 * Centralized Network Connectivity & Offline Detection Utility.
 *
 * Implements:
 *   1. Hardware & browser-level online/offline state tracking via navigator.onLine.
 *   2. Instant short-circuiting for all remote fetches when offline (prevents Chromium
 *      net::ERR_INTERNET_DISCONNECTED red console error spam).
 *   3. Intelligent failure cooldown: when a fetch fails with a network-level disconnect
 *      (Failed to fetch / NetworkError), immediately marks offline cooldown so parallel
 *      or subsequent calls gracefully fall back to local in-memory algorithms.
 *   4. Reactive subscriber listeners for online / offline window events.
 */

let isKnownOffline = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
  ? !navigator.onLine
  : false;

let lastFailureTimestamp = 0;
const FAILURE_COOLDOWN_MS = 25000; // 25s cooldown after network failure before retrying remote endpoints
const subscribers = new Set();

function notifySubscribers(online) {
  for (const cb of subscribers) {
    try {
      cb(online);
    } catch {
      // ignore subscriber errors
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isKnownOffline = false;
    lastFailureTimestamp = 0;
    notifySubscribers(true);
  });

  window.addEventListener('offline', () => {
    isKnownOffline = true;
    lastFailureTimestamp = Date.now();
    notifySubscribers(false);
  });
}

/**
 * Checks whether the client environment is currently offline or experiencing a network outage.
 * @returns {boolean}
 */
export function isOffline() {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' && !navigator.onLine) {
    return true;
  }
  if (isKnownOffline) {
    if (Date.now() - lastFailureTimestamp < FAILURE_COOLDOWN_MS) {
      return true;
    }
    // Cooldown elapsed, allow retry
    isKnownOffline = false;
  }
  return false;
}

/**
 * Convenience helper: true if network is considered connected.
 * @returns {boolean}
 */
export function isOnline() {
  return !isOffline();
}

/**
 * Call when an HTTP request fails with a network-level error.
 * Activates offline cooldown so remaining queries immediately use local fallbacks.
 * @param {Error|unknown} error
 */
export function markNetworkFailure(error) {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    if (!navigator.onLine) {
      isKnownOffline = true;
      lastFailureTimestamp = Date.now();
      notifySubscribers(false);
      return;
    }
    const msg = error?.message || String(error || '');
    if (msg.includes('ERR_INTERNET_DISCONNECTED')) {
      isKnownOffline = true;
      lastFailureTimestamp = Date.now();
      notifySubscribers(false);
    }
    // When navigator.onLine === true, individual fetch failures (e.g. rate limits or CORS)
    // should not disable OSM or take down the entire application.
    return;
  }

  // Node.js or test environments without navigator.onLine
  const msg = error?.message || String(error || '');
  if (error?.name === 'AbortError' || msg.includes('aborted')) {
    // Aborted requests are normal lifecycle cancellations, not network disconnects
    return;
  }

  const isNetError =
    error?.name === 'TypeError' ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('ERR_INTERNET_DISCONNECTED') ||
    msg.includes('Network request failed');

  if (isNetError) {
    isKnownOffline = true;
    lastFailureTimestamp = Date.now();
    notifySubscribers(false);
  }
}

/**
 * Resets network status back to connected (used in tests or manual reconnect).
 */
export function resetNetworkStatus() {
  isKnownOffline = false;
  lastFailureTimestamp = 0;
  notifySubscribers(true);
}

/**
 * Manually force offline mode (used in tests or offline toggle).
 */
export function forceOfflineStatus(offline = true) {
  isKnownOffline = offline;
  lastFailureTimestamp = offline ? Date.now() : 0;
  notifySubscribers(!offline);
}

/**
 * Subscribes a listener to online/offline state changes.
 * @param {(online: boolean) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function subscribeNetworkStatus(callback) {
  if (typeof callback !== 'function') return () => {};
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}
