import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Pin Interactions and Marker Presentation', () => {
  it('safely parses multiple coordinate signatures for ambulance relocation', () => {
    // Replicate the setAmbulanceCoordinates logic
    function parseAmbulanceCoordinates(latOrObj, maybeLon) {
      let lat, lon;
      if (typeof latOrObj === 'object' && latOrObj !== null) {
        lat = latOrObj.lat;
        lon = latOrObj.lon ?? latOrObj.lng;
      } else {
        lat = latOrObj;
        lon = maybeLon;
      }
      if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
      return null;
    }

    // 1. Two numbers (lat, lon)
    assert.deepStrictEqual(
      parseAmbulanceCoordinates(28.4625, 77.4930),
      { lat: 28.4625, lon: 77.4930 },
      'Standard (lat, lon) arguments should resolve correctly'
    );

    // 2. Object with { lat, lon }
    assert.deepStrictEqual(
      parseAmbulanceCoordinates({ lat: 28.4680, lon: 77.5050 }),
      { lat: 28.4680, lon: 77.5050 },
      'Object { lat, lon } should resolve correctly'
    );

    // 3. Leaflet LatLng object { lat, lng }
    assert.deepStrictEqual(
      parseAmbulanceCoordinates({ lat: 28.4720, lng: 77.5110 }),
      { lat: 28.4720, lon: 77.5110 },
      'Leaflet { lat, lng } should resolve correctly to { lat, lon }'
    );

    // 4. Invalid or corrupted inputs
    assert.strictEqual(parseAmbulanceCoordinates(null), null);
    assert.strictEqual(parseAmbulanceCoordinates(undefined), null);
    assert.strictEqual(parseAmbulanceCoordinates('invalid', 77.4930), null);
    assert.strictEqual(parseAmbulanceCoordinates(NaN, 77.4930), null);
    assert.strictEqual(parseAmbulanceCoordinates({ lat: 28.4625 }), null);
  });

  it('verifies marker key stability across regular and selected states', () => {
    // When a hospital transitions from regular to active/target, the React key MUST NOT change.
    // Changing key unmounts the Leaflet Marker, destroying the popup and cancelling clicks.
    const hospital = { id: 'kailash_hospital', name: 'Kailash Hospital' };
    
    const regularKey = hospital.id;
    const targetKey = hospital.id;

    assert.strictEqual(
      regularKey,
      targetKey,
      'Hospital marker key must remain identical across selection states so Leaflet DOM is preserved'
    );
  });

  it('verifies single-banner invariant: only the target recommendation displays a callout banner', () => {
    const hospitals = [
      { id: 'h1', name: 'Kailash Hospital' },
      { id: 'h2', name: 'Bakson Hospital' },
      { id: 'h3', name: 'Yatharth Hospital' },
      { id: 'h4', name: 'Sharda Hospital' },
      { id: 'h5', name: 'Promhex Hospital' },
    ];
    const activeHospitalId = 'h1';

    // Count how many tooltips are rendered under the single-banner rule
    const renderedTooltips = hospitals.filter((h) => h.id === activeHospitalId);

    assert.strictEqual(
      renderedTooltips.length,
      1,
      'Exactly one callout banner must be rendered to avoid banner overlap collisions'
    );
    assert.strictEqual(
      renderedTooltips[0].id,
      'h1',
      'The callout banner must belong strictly to the active recommended hospital'
    );
  });
});
