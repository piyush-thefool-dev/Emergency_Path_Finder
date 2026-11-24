import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  isOffline,
  isOnline,
  markNetworkFailure,
  resetNetworkStatus,
  forceOfflineStatus,
  subscribeNetworkStatus,
} from '../utils/network.js';
import { computeOsrmTableMetrics } from '../services/hospitalFilterService.js';
import { fetchLiveWeather, getOfflineFallbackWeather } from '../services/weatherService.js';
import { fetchWibHospitals } from '../services/wibHospitalService.js';

describe('Network Offline Utility & Fault Isolation', () => {
  beforeEach(() => {
    resetNetworkStatus();
  });

  it('reports online by default when no failure has occurred', () => {
    assert.strictEqual(isOffline(), false);
    assert.strictEqual(isOnline(), true);
  });

  it('activates offline mode when markNetworkFailure is invoked with a TypeError (Failed to fetch)', () => {
    markNetworkFailure(new TypeError('Failed to fetch'));
    assert.strictEqual(isOffline(), true);
    assert.strictEqual(isOnline(), false);
  });

  it('notifies subscribers when network transition occurs', () => {
    const states = [];
    const unsub = subscribeNetworkStatus((online) => {
      states.push(online);
    });

    forceOfflineStatus(true);
    assert.strictEqual(isOffline(), true);

    resetNetworkStatus();
    assert.strictEqual(isOffline(), false);

    unsub();
    assert.ok(states.length >= 2, 'Subscriber should have received notifications');
    assert.strictEqual(states[states.length - 2], false);
    assert.strictEqual(states[states.length - 1], true);
  });

  it('computeOsrmTableMetrics returns local calibrated model instantly without fetch when offline', async () => {
    forceOfflineStatus(true);
    const userPos = { lat: 28.4625, lon: 77.4930 };
    const candidates = [
      { id: 'h1', name: 'Test Hospital', lat: 28.4800, lon: 77.5100, distanceM: 2500, travelTimeSec: 300 },
    ];

    const results = await computeOsrmTableMetrics(userPos, candidates);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].routingSource, 'Calibrated Road Network Model (Offline)');
    assert.ok(results[0].durationSec > 0);
    assert.ok(results[0].roadDistanceM > 0);
  });

  it('fetchLiveWeather returns fallback atmospheric metrics without throwing when offline', async () => {
    forceOfflineStatus(true);
    const weather = await fetchLiveWeather();
    assert.strictEqual(weather.isLive, false);
    assert.strictEqual(weather.weatherId, 'clear');
    assert.strictEqual(weather.frictionFactor, 1.0);
    assert.ok(weather.label.includes('Offline'));
  });

  it('fetchWibHospitals returns bundled 280-hospital registry without throwing when offline', async () => {
    forceOfflineStatus(true);
    const wib = await fetchWibHospitals();
    assert.strictEqual(wib.isLive, false);
    assert.ok(wib.hospitals.length > 0);
    assert.ok(wib.source.includes('Offline'));
  });
});
