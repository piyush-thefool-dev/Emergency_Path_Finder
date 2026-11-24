import test from 'node:test';
import assert from 'node:assert/strict';
import { getSearchRelevance } from '../utils/hospitalSearch.js';
import { haversineDistance } from '../utils/geo.js';
import { PAN_INDIA_HOSPITALS } from '../data/panIndiaHospitals.js';

test('Smart Multi-Token Hospital Search Verification', async (t) => {
  await t.test('"aiims delhi" matches "AIIMS New Delhi" with top relevance', () => {
    const aiimsDelhi = PAN_INDIA_HOSPITALS.find((h) => h.id === 'hosp_aiims_delhi');
    assert.ok(aiimsDelhi, 'AIIMS New Delhi must exist in registry');

    const score = getSearchRelevance(aiimsDelhi, 'aiims delhi');
    assert.ok(score > 0, '"aiims delhi" must produce positive score for AIIMS New Delhi');
    assert.ok(score >= 500, 'Score should reflect multi-token match in name');
  });

  await t.test('"delhi aiims" matches "AIIMS New Delhi" regardless of word order', () => {
    const aiimsDelhi = PAN_INDIA_HOSPITALS.find((h) => h.id === 'hosp_aiims_delhi');
    const score = getSearchRelevance(aiimsDelhi, 'delhi aiims');
    assert.ok(score > 0, '"delhi aiims" must match AIIMS New Delhi');
  });

  await t.test('"gangaram" matches "Sir Ganga Ram Hospital" via space-insensitive search', () => {
    const gangaram = PAN_INDIA_HOSPITALS.find((h) => h.id === 'hosp_gangaram_delhi');
    assert.ok(gangaram, 'Sir Ganga Ram Hospital must exist in registry');

    const score = getSearchRelevance(gangaram, 'gangaram');
    assert.ok(score > 0, '"gangaram" without space must match Sir Ganga Ram Hospital');
  });

  await t.test('"max saket" matches "Max Hospital Saket"', () => {
    const maxSaket = PAN_INDIA_HOSPITALS.find((h) => h.id === 'hosp_max_saket');
    assert.ok(maxSaket, 'Max Saket must exist in registry');

    const score = getSearchRelevance(maxSaket, 'max saket');
    assert.ok(score > 0, '"max saket" must match Max Hospital Saket');
  });

  await t.test('"kailash noida" matches Kailash facilities in NCR', () => {
    const kailashNoida = PAN_INDIA_HOSPITALS.find((h) => h.id === 'hosp_kailash_noida_sec27');
    assert.ok(kailashNoida, 'Kailash Noida Sec 27 must exist in registry');

    const score = getSearchRelevance(kailashNoida, 'kailash noida');
    assert.ok(score > 0, '"kailash noida" must match Kailash Hospital Noida');
  });

  await t.test('Empty query returns default match score 1 for any hospital', () => {
    const first = PAN_INDIA_HOSPITALS[0];
    assert.equal(getSearchRelevance(first, ''), 1);
    assert.equal(getSearchRelevance(first, '   '), 1);
  });

  await t.test('100 km radius filter: includes all reachable hospitals within 100 km and excludes distant facilities', () => {
    const amb = { lat: 28.4625, lon: 77.4930 }; // Greater Noida
    const SEARCH_MAX_RADIUS_M = 100 * 1000;

    const reachable = PAN_INDIA_HOSPITALS.filter((h) => {
      const d = haversineDistance(amb.lat, amb.lon, h.lat, h.lon);
      return d <= SEARCH_MAX_RADIUS_M;
    });

    // Should include Greater Noida, Noida, Delhi, Gurugram, Faridabad apex centers
    assert.ok(reachable.length >= 70, `Expected at least 70 hospitals within 100 km, got ${reachable.length}`);
    assert.ok(reachable.some((h) => h.id === 'hosp_aiims_delhi'), 'AIIMS Delhi (~36 km) must be in 100 km search');
    assert.ok(reachable.some((h) => h.id === 'hosp_kailash_noida_sec27'), 'Kailash Noida must be in 100 km search');
    assert.ok(reachable.some((h) => h.id === 'hosp_max_saket'), 'Max Saket must be in 100 km search');

    // Should strictly exclude distant national hospitals > 100 km (e.g. Mumbai, Bangalore, Kolkata)
    assert.ok(!reachable.some((h) => h.city === 'Mumbai'), 'Mumbai hospitals (>1000 km) must be excluded from 100 km search');
    assert.ok(!reachable.some((h) => h.city === 'Bengaluru'), 'Bengaluru hospitals (>1700 km) must be excluded from 100 km search');
    assert.ok(!reachable.some((h) => h.city === 'Kolkata'), 'Kolkata hospitals (>1300 km) must be excluded from 100 km search');
  });
});
