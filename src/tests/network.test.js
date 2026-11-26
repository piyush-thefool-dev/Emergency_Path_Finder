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
import {
  fetchWibHospitals,
  fetchOverpassHospitals,
  buildGeoapifyPlacesUrl,
  mapGeoapifyFeaturesToHospitals,
  fetchGeoapifyHospitals,
} from '../services/wibHospitalService.js';
import {
  fetchRoadRoute,
  extractWaypointsForRoadDetour,
  buildAvoidCorridorPolygons,
} from '../services/roadSnapService.js';

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

describe('Geoapify Places API Hospital Discovery & Overpass Fallback', () => {
  beforeEach(() => {
    resetNetworkStatus();
  });

  it('builds a valid Geoapify Places v2 healthcare.hospital rect URL', () => {
    const url = buildGeoapifyPlacesUrl(
      { south: 28.36, west: 76.98, north: 28.72, east: 77.59 },
      'test_geoapify_key',
      50
    );
    assert.ok(url.startsWith('https://api.geoapify.com/v2/places?'));
    assert.ok(url.includes('categories=healthcare.hospital'));
    assert.ok(url.includes('filter=rect%3A76.98%2C28.36%2C77.59%2C28.72') || url.includes('filter=rect:76.98,28.36,77.59,28.72'));
    assert.ok(url.includes('limit=50'));
    assert.ok(url.includes('apiKey=test_geoapify_key'));
  });

  it('maps Geoapify GeoJSON features into normalized hospital records', () => {
    const sampleGeoJson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            place_id: 'gp_123',
            name: 'Apollo Spectra Hospital',
            formatted: 'Alpha 1, Greater Noida, UP 201310',
            lat: 28.4623,
            lon: 77.489,
            categories: ['healthcare', 'healthcare.hospital'],
            contact: { phone: '+91 120 4000000' },
          },
          geometry: { type: 'Point', coordinates: [77.489, 28.4623] },
        },
        {
          type: 'Feature',
          properties: { lat: 28.5, lon: 77.5 }, // Missing name -> skipped
        },
      ],
    };

    const mapped = mapGeoapifyFeaturesToHospitals(sampleGeoJson);
    assert.strictEqual(mapped.length, 1);
    assert.strictEqual(mapped[0].id, 'geoapify_gp_123');
    assert.strictEqual(mapped[0].name, 'Apollo Spectra Hospital');
    assert.strictEqual(mapped[0].lat, 28.4623);
    assert.strictEqual(mapped[0].lon, 77.489);
    assert.ok(mapped[0].specialties.includes('general_emergency'));
    assert.strictEqual(mapped[0].source, 'Geoapify Places API v2');
  });

  it('returns [] cleanly when offline or API key is missing', async () => {
    const noKey = await fetchGeoapifyHospitals({ south: 28.4, west: 77.4, north: 28.5, east: 77.5 }, '');
    assert.deepStrictEqual(noKey, []);

    forceOfflineStatus(true);
    const offlineRes = await fetchGeoapifyHospitals({ south: 28.4, west: 77.4, north: 28.5, east: 77.5 }, 'test_key');
    assert.deepStrictEqual(offlineRes, []);
  });

  it('fetchOverpassHospitals falls back to Geoapify Places API when Overpass mirrors fail', async () => {
    const origFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      if (String(url).includes('overpass')) {
        return { ok: false, status: 504 };
      }
      if (String(url).includes('api.geoapify.com/v2/places')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {
                  place_id: 'fallback_1',
                  name: 'Kailash Hospital',
                  lat: 28.4722,
                  lon: 77.5036,
                  categories: ['healthcare.hospital'],
                },
              },
            ],
          }),
        };
      }
      return { ok: false, status: 404 };
    };

    try {
      const hospitals = await fetchOverpassHospitals(
        { south: 28.4, west: 77.4, north: 28.5, east: 77.5 },
        { geoapifyApiKey: 'test_geoapify_key' }
      );
      assert.strictEqual(hospitals.length, 1);
      assert.strictEqual(hospitals[0].name, 'Kailash Hospital');
      assert.strictEqual(hospitals[0].source, 'Geoapify Places API v2');
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});

describe('Incident Rerouting & Closed-Road Detour Resolution', () => {
  beforeEach(() => {
    resetNetworkStatus();
  });

  it('always fetches OSRM alternatives when incidents exist even if Valhalla answered with a blocked route', async () => {
    const origFetch = globalThis.fetch;
    // Closed road directly at midpoint [28.465, 77.495] -> [28.465, 77.505]
    const closedSeg = [[28.465, 77.495], [28.465, 77.505]];
    const start = [28.462, 77.493];
    const end = [28.468, 77.507];

    // Precision-6 polyline encoder helper for simulated Valhalla response
    const encodePoly6 = (pts) => {
      let lastLat = 0, lastLng = 0, out = '';
      const enc = (v) => {
        let n = v < 0 ? ~(v << 1) : (v << 1);
        while (n >= 0x20) { out += String.fromCharCode((0x20 | (n & 0x1f)) + 63); n >>= 5; }
        out += String.fromCharCode(n + 63);
      };
      for (const [la, lo] of pts) {
        const iLat = Math.round(la * 1e6), iLng = Math.round(lo * 1e6);
        enc(iLat - lastLat); enc(iLng - lastLng);
        lastLat = iLat; lastLng = iLng;
      }
      return out;
    };
    const valhallaBlockedShape = encodePoly6([[28.462, 77.493], [28.465, 77.500], [28.468, 77.507]]);

    let osrmCalledWithAlternatives = false;
    globalThis.fetch = async (url, init) => {
      const u = String(url);
      if (u.includes('valhalla')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            trip: {
              legs: [{ shape: valhallaBlockedShape }],
              summary: { time: 180, length: 1.5 },
            },
          }),
        };
      }
      if (u.includes('/route/v1/driving/')) {
        if (u.includes('alternatives=3')) osrmCalledWithAlternatives = true;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            code: 'Ok',
            routes: [
              {
                // Route 0: crosses closed segment at [28.465, 77.500]
                duration: 180,
                distance: 1500,
                geometry: {
                  coordinates: [[77.493, 28.462], [77.500, 28.465], [77.507, 28.468]],
                },
              },
              {
                // Route 1: wide clean southern bypass around closure (>1km away)
                duration: 240,
                distance: 2100,
                geometry: {
                  coordinates: [[77.493, 28.462], [77.493, 28.452], [77.507, 28.452], [77.507, 28.468]],
                },
              },
            ],
          }),
        };
      }
      return { ok: false, status: 404 };
    };

    try {
      const res = await fetchRoadRoute({ start, end, closed: [closedSeg], slow: [] });
      assert.strictEqual(osrmCalledWithAlternatives, true, 'Must query OSRM alternatives when incidents are reported');
      assert.strictEqual(res.status, 'rerouted', 'Must pick the alternate detour bypassing the closed road');
      assert.ok(res.coords.some(([lat]) => lat < 28.455), 'Must return southern bypass coordinates');
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('extracts intermediate graph detour waypoints cleanly without exceeding maxVia', () => {
    const coords = [
      [28.460, 77.490],
      [28.461, 77.491],
      [28.462, 77.492],
      [28.463, 77.493],
      [28.464, 77.494],
      [28.465, 77.495],
      [28.466, 77.496],
    ];
    const via = extractWaypointsForRoadDetour(coords, 3);
    assert.strictEqual(via.length, 3);
    assert.deepStrictEqual(via[0], [28.461, 77.491]);
  });

  it('samples multi-point street incident sub-segments and builds safe ORS avoid polygons excluding start/end', () => {
    const start = [28.4625, 77.4930];
    const end = [28.4623, 77.4890];
    // Multi-point short curved street blockage near midpoint (~80m along road)
    const multiSeg = [
      [28.4631, 77.4915],
      [28.4632, 77.4911],
      [28.4631, 77.4906],
    ];
    // Should exclude segments that directly swallow start/end, keeping mid-corridor closures
    const polys = buildAvoidCorridorPolygons([multiSeg, [start, [28.4626, 77.4929]]], start, end);
    assert.strictEqual(polys.length, 1, 'Should build polygon only for mid-corridor closure not touching endpoints');
    assert.ok(polys[0].length >= 5, 'Polygon ring must be closed');
  });

  it('uses short urban block bypasses around multi-point street closures cleanly', async () => {
    const origFetch = globalThis.fetch;
    const start = [28.4625, 77.4930];
    const end = [28.4623, 77.4890];
    // Block the middle vertex of a 3-point curved road (~70m strip)
    const closedLocal = [
      [28.4630, 77.4914],
      [28.4634, 77.4910],
      [28.4630, 77.4906],
    ];
    const seenViaOffsets = [];

    globalThis.fetch = async (url) => {
      const u = String(url);
      if (u.includes('valhalla')) return { ok: false, status: 404 };
      if (u.includes('/nearest/v1/driving/')) {
        const coordsPart = u.split('/nearest/v1/driving/')[1].split('?')[0];
        const [lon, lat] = coordsPart.split(',').map(Number);
        seenViaOffsets.push([lat, lon]);
        // Return a clean northern perimeter street point 160m away
        return {
          ok: true,
          status: 200,
          json: async () => ({
            code: 'Ok',
            waypoints: [{ location: [77.4910, lat > 28.4642 ? lat : 28.4648] }],
          }),
        };
      }
      if (u.includes('/route/v1/driving/')) {
        const coordsPart = u.split('/route/v1/driving/')[1].split('?')[0];
        const pairs = coordsPart.split(';').map((s) => s.split(',').map(Number));
        if (pairs.length === 2) {
          // Direct OSRM only gives the blocked street crossing closedLocal middle [28.4634, 77.4910]
          return {
            ok: true,
            status: 200,
            json: async () => ({
              code: 'Ok',
              routes: [
                {
                  duration: 60,
                  distance: 420,
                  geometry: { coordinates: [[77.4930, 28.4625], [77.4910, 28.4634], [77.4890, 28.4623]] },
                },
              ],
            }),
          };
        }
        // Detour via northern street skips closedLocal[1] completely
        return {
          ok: true,
          status: 200,
          json: async () => ({
            code: 'Ok',
            routes: [
              {
                duration: 105,
                distance: 780,
                geometry: {
                  coordinates: [
                    [77.4930, 28.4625],
                    [77.4930, 28.4648],
                    [77.4890, 28.4648],
                    [77.4890, 28.4623],
                  ],
                },
              },
            ],
          }),
        };
      }
      return { ok: false, status: 404 };
    };

    try {
      const res = await fetchRoadRoute({ start, end, closed: [closedLocal], slow: [] });
      assert.strictEqual(res.status, 'rerouted', 'Must detour via adjacent paved street around multi-point closure');
      assert.ok(res.coords.some(([lat]) => lat > 28.4645), 'Detour must follow clean bypass street');
      assert.ok(seenViaOffsets.length >= 6, 'Should probe both urban-block and sector perpendicular offsets');
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});
