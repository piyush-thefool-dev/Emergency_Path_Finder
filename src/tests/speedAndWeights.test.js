import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function expect(actual) {
  return {
    toBe(expected) { assert.equal(actual, expected); },
    toEqual(expected) { assert.deepEqual(actual, expected); },
    toBeNull() { assert.equal(actual, null); },
    toBeGreaterThan(expected) { assert.ok(actual > expected); },
    toBeLessThan(expected) { assert.ok(actual < expected); },
    toBeCloseTo(expected, precision = 2) {
      const diff = Math.abs(actual - expected);
      const tolerance = Math.pow(10, -precision) / 2;
      assert.ok(diff <= tolerance, `${actual} not close to ${expected} within ${tolerance}`);
    },
  };
}
import { kphToMps, mpsToKph } from '../utils/geo.js';
import { validateSpeed } from '../utils/validators.js';
import { calculateEdgeWeight } from '../services/edgeWeights.js';

describe('Speed Conversions and Edge Travel-Time Physics', () => {
  it('correctly converts km/h to m/s via v(m/s) = v(km/h) * 1000 / 3600', () => {
    // 36 km/h = 10 m/s
    expect(kphToMps(36)).toBeCloseTo(10, 4);

    // 72 km/h = 20 m/s
    expect(kphToMps(72)).toBeCloseTo(20, 4);

    // 50 km/h = 13.8889 m/s
    expect(kphToMps(50)).toBeCloseTo(13.8889, 3);
  });

  it('correctly converts m/s back to km/h', () => {
    expect(mpsToKph(10)).toBeCloseTo(36, 4);
    expect(mpsToKph(20)).toBeCloseTo(72, 4);
  });

  it('validates and handles zero, negative, or missing speeds without dividing by zero', () => {
    // Zero speed
    const zeroRes = validateSpeed(0, 50, 'primary');
    expect(zeroRes.wasFallbackApplied).toBe(true);
    expect(zeroRes.validSpeedKph).toBe(50); // Fallback to posted limit

    // Negative speed
    const negRes = validateSpeed(-15, null, 'residential');
    expect(negRes.wasFallbackApplied).toBe(true);
    expect(negRes.validSpeedKph).toBe(30); // Default residential limit

    // Missing / null speed
    const nullRes = validateSpeed(null, null, 'secondary');
    expect(nullRes.wasFallbackApplied).toBe(true);
    expect(nullRes.validSpeedKph).toBe(50); // Default secondary limit

    // Implausibly high speed (e.g. 350 km/h)
    const highRes = validateSpeed(350, 60, 'primary');
    expect(highRes.wasFallbackApplied).toBe(true);
    expect(highRes.validSpeedKph).toBe(60);
  });

  it('computes edge traversal time: t(e) = L(e) / v(e)', () => {
    // Road: L = 1000m, speed = 36 km/h (10 m/s)
    // Travel time = 1000 / 10 = 100 seconds
    const edge = {
      id: 'test_edge',
      from: 'A',
      to: 'B',
      lengthM: 1000,
      roadType: 'primary',
      speedLimitKph: 36,
      hasSignal: false,
      isNarrow: false,
      hasSpeedBreaker: false,
      inSchoolZone: false,
    };

    const result = calculateEdgeWeight(edge, {
      timeOfDay: 'night_freeflow', // 1.0 multiplier
      weather: 'clear',           // 1.0 multiplier
      signalPriorityEnabled: false,
    });

    expect(result.travelTimeSec).toBeCloseTo(100, 1);
  });

  it('reduces intersection signal delay when signal priority is simulated', () => {
    const signalEdge = {
      id: 'signal_edge',
      from: 'A',
      to: 'B',
      lengthM: 500,
      roadType: 'primary',
      speedLimitKph: 50,
      hasSignal: true,
    };

    const standard = calculateEdgeWeight(signalEdge, { signalPriorityEnabled: false });
    const greenCorridor = calculateEdgeWeight(signalEdge, { signalPriorityEnabled: true });

    // Standard signal delay is 25s, simulated priority is 4s
    expect(standard.signalDelaySec).toBe(25);
    expect(greenCorridor.signalDelaySec).toBe(4);
    expect(greenCorridor.travelTimeSec).toBeLessThan(standard.travelTimeSec);
  });

  it('adds penalties for narrow lanes and speed breakers without overriding legal paths', () => {
    const roughEdge = {
      id: 'rough_edge',
      from: 'A',
      to: 'B',
      lengthM: 500,
      roadType: 'residential',
      speedLimitKph: 30,
      isNarrow: true,
      hasSpeedBreaker: true,
    };

    const result = calculateEdgeWeight(roughEdge);
    expect(result.suitabilityPenaltiesSec).toBeGreaterThan(0);
    expect(result.isClosed).toBe(false);
  });
});
