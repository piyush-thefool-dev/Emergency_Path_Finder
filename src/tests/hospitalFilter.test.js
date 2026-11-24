import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  filterHospitalsByRadius,
  filterAndRankHospitalsByOsrmEta,
  DEFAULT_RADIUS_KM,
  FALLBACK_RADIUS_KM,
  MIN_HOSPITALS_THRESHOLD,
  DEFAULT_ROAD_DISTANCE_CUTOFF_KM,
  TOP_HOSPITALS_CAP,
} from '../services/hospitalFilterService.js';
import { PAN_INDIA_HOSPITALS } from '../data/panIndiaHospitals.js';

describe('Two-Stage Hospital Distance & ETA Filtering', () => {
  const userPos = { lat: 28.4625, lon: 77.4930 }; // Near DTC Knowledge Park III, Greater Noida

  it('Stage 1: prefetches and filters hospitals within automatic 5 km tier when available', () => {
    const result = filterHospitalsByRadius(userPos, PAN_INDIA_HOSPITALS);
    assert.strictEqual(result.isFallback, false);
    assert.strictEqual(result.effectiveRadiusKm, 5, 'Should stay on 5 km corridor when hospitals exist under 5 km');
    assert.ok(result.candidates.length >= 1, 'Should find hospitals in Greater Noida within 5 km');
    // Every candidate must be within 5 km
    for (const h of result.candidates) {
      assert.ok(h.haversineKm <= 5.01, `Hospital ${h.name} distance ${h.haversineKm} km should be <= 5 km`);
    }
  });

  it('Stage 1: automatically cascades from 5 km to 10 km when no hospitals exist under 5 km', () => {
    // Sparse dataset with 0 hospitals within 5 km, but 2 hospitals between 5 km and 10 km
    const sparseHospitals = [
      { id: 'h1', name: 'At 7 km', lat: 28.5200, lon: 77.5100 },  // ~7 km
      { id: 'h2', name: 'At 9 km', lat: 28.5400, lon: 77.5200 },  // ~9 km
      { id: 'h3', name: 'Far 3', lat: 28.6000, lon: 77.5400 },    // ~16 km
    ];

    const result = filterHospitalsByRadius(userPos, sparseHospitals);
    assert.strictEqual(result.isFallback, true, 'Should trigger automatic fallback expansion');
    assert.strictEqual(result.effectiveRadiusKm, 10, 'Should cascade to 10 km tier');
    assert.ok(result.candidates.length >= 2, 'Should include hospitals within 10 km');
    assert.ok(result.candidates.every((h) => h.haversineKm <= 10.01));
  });

  it('Stage 1: automatically cascades to 20 km when no hospitals exist under 10 km', () => {
    // Sparse dataset with 0 hospitals within 10 km, but 2 hospitals within 20 km
    const farHospitals = [
      { id: 'h1', name: 'Far 1', lat: 28.5900, lon: 77.5300 },   // ~14.5 km
      { id: 'h2', name: 'Far 2', lat: 28.6000, lon: 77.5400 },   // ~16 km
      { id: 'h3', name: 'Way Out', lat: 28.9500, lon: 77.8000 }, // >50 km
    ];

    const result = filterHospitalsByRadius(userPos, farHospitals);
    assert.strictEqual(result.isFallback, true);
    assert.strictEqual(result.effectiveRadiusKm, 20, 'Should cascade to 20 km tier');
    assert.strictEqual(result.candidates.length, 2, 'Should include the 2 hospitals within 20 km');
    assert.ok(!result.candidates.some((h) => h.id === 'h3'), 'Should exclude hospital beyond 20 km');
  });

  it('Stage 2: discards candidate hospitals whose road distance exceeds 12 km in normal 10 km mode', async () => {
    // Test dataset with a river/expressway trap: straight line is 7 km, but road distance is 16 km
    const mockHospitals = [
      {
        id: 'h_close_road',
        name: 'Direct Road Hospital',
        lat: 28.4800,
        lon: 77.5000,
        distanceM: 3500, // 3.5 km road
        travelTimeSec: 360, // 6 min
      },
      {
        id: 'h_river_trap',
        name: 'Across River (No U-Turn)',
        lat: 28.4900,
        lon: 77.5300, // ~4.5 km straight-line
        distanceM: 15500, // 15.5 km road distance (> 12 km cutoff!)
        travelTimeSec: 1800, // 30 min
      },
      {
        id: 'h_medium_road',
        name: 'Arterial Hospital',
        lat: 28.4850,
        lon: 77.5100,
        distanceM: 6200, // 6.2 km road
        travelTimeSec: 620, // 10.3 min
      },
    ];

    const res = await filterAndRankHospitalsByOsrmEta(userPos, mockHospitals, {
      radiusKm: 10,
      fallbackRadiusKm: 20,
      minThreshold: 1, // Don't trigger fallback
      roadDistanceCutoffKm: 12,
    });

    assert.strictEqual(res.isFallback, false);
    const hasRiverTrap = res.topHospitals.some((h) => h.id === 'h_river_trap');
    assert.strictEqual(hasRiverTrap, false, 'Hospital with road distance > 12 km must be discarded');
    assert.ok(res.topHospitals.length >= 2, 'Should keep safe hospitals with road distance <= 12 km');
  });

  it('Stage 2: ranks candidate hospitals in ascending order by driving ETA rather than straight-line distance', async () => {
    // Hospital A: closer straight-line (2.5 km), but congested road takes 12 mins (720s)
    // Hospital B: farther straight-line (4.5 km), but fast highway corridor takes 6 mins (360s)
    const mockHospitals = [
      {
        id: 'h_slow_close',
        name: 'Congested Alley Clinic',
        lat: 28.4750,
        lon: 77.5000,
        distanceM: 4000,
        travelTimeSec: 720, // 12 min
      },
      {
        id: 'h_fast_far',
        name: 'Expressway Trauma Center',
        lat: 28.4950,
        lon: 77.5250,
        distanceM: 6500,
        travelTimeSec: 360, // 6 min
      },
    ];

    const res = await filterAndRankHospitalsByOsrmEta(userPos, mockHospitals, {
      radiusKm: 10,
      minThreshold: 1,
    });

    assert.ok(res.topHospitals.length >= 2);
    // Hospital B must rank first because driving ETA (6m) < Hospital A (12m)
    assert.strictEqual(res.topHospitals[0].id, 'h_fast_far', 'Fast highway hospital must rank ahead of congested closer one');
    assert.strictEqual(res.topHospitals[1].id, 'h_slow_close');
    assert.ok(res.topHospitals[0].durationMin < res.topHospitals[1].durationMin);
  });

  it('Stage 2: caps the displayed hospitals to exactly the Top 5 closest by driving ETA', async () => {
    const res = await filterAndRankHospitalsByOsrmEta(userPos, PAN_INDIA_HOSPITALS, {
      radiusKm: 10,
      cap: 5,
    });

    assert.ok(res.topHospitals.length > 0);
    assert.ok(res.topHospitals.length <= 5, `Expected at most 5 hospitals, got ${res.topHospitals.length}`);
    // Check that each hospital has ETA (mins) and Road Distance (km)
    for (const h of res.topHospitals) {
      assert.ok(h.durationMin !== undefined && h.durationMin !== null, `Hospital ${h.name} missing durationMin`);
      assert.ok(h.roadDistanceKm !== undefined && h.roadDistanceKm !== null, `Hospital ${h.name} missing roadDistanceKm`);
      assert.ok(h.durationMin > 0, 'Duration should be > 0');
      assert.ok(h.roadDistanceKm > 0, 'Road distance should be > 0');
    }
    // Verify ascending order by durationMin
    for (let i = 1; i < res.topHospitals.length; i++) {
      assert.ok(
        res.topHospitals[i].durationMin >= res.topHospitals[i - 1].durationMin,
        `Hospital ${i} ETA ${res.topHospitals[i].durationMin} should be >= hospital ${i - 1} ETA ${res.topHospitals[i - 1].durationMin}`
      );
    }
  });
});
