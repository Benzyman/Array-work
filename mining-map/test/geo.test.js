const test = require('node:test');
const assert = require('node:assert/strict');
const geo = require('../src/geo');

test('Nigerian cities are inside Nigeria with the right state', () => {
  const cases = [
    [6.45, 3.39, 'Lagos'],
    [9.06, 7.49, 'Federal Capital Territory'],
    [12.0, 8.52, 'Kano'],
    [11.85, 13.16, 'Borno'],
    [9.9, 8.86, 'Plateau'],
    [4.95, 8.32, 'Cross River'],
    [13.06, 5.24, 'Sokoto'],
  ];
  for (const [lat, lng, state] of cases) {
    const r = geo.locate(lat, lng);
    assert.equal(r.accepted, true, `${state} should be accepted`);
    assert.equal(r.state, state);
    assert.ok(r.lga, `${state} should have an LGA`);
  }
});

test('places in neighbouring countries are rejected', () => {
  const outside = [
    [6.37, 2.42], // Cotonou, Benin
    [4.05, 9.7], // Douala, Cameroon
    [13.5, 2.1], // Niamey, Niger
    [12.1, 15.05], // N'Djamena, Chad
    [51.5, -0.12], // London
  ];
  for (const [lat, lng] of outside) assert.equal(geo.locate(lat, lng).accepted, false, `${lat},${lng}`);
});

test('invalid numbers are not valid', () => {
  assert.equal(geo.locate(NaN, 7).valid, false);
  assert.equal(geo.locate(95, 7).valid, false);
});

test('polygon area: 0.01° square near Abuja is about 121.6 ha', () => {
  const g = { type: 'Polygon', coordinates: [[[7.49, 9.05], [7.5, 9.05], [7.5, 9.06], [7.49, 9.06], [7.49, 9.05]]] };
  const ha = geo.polygonAreaHa(g);
  assert.ok(ha > 120 && ha < 123, `got ${ha}`);
});

test('validatePolygon rejects polygons that leave Nigeria', () => {
  const ok = { type: 'Polygon', coordinates: [[[7.49, 9.05], [7.5, 9.05], [7.5, 9.06], [7.49, 9.05]]] };
  assert.equal(geo.validatePolygon(ok), null);
  const bad = { type: 'Polygon', coordinates: [[[2.40, 6.37], [2.45, 6.37], [2.45, 6.40], [2.40, 6.37]]] };
  assert.match(geo.validatePolygon(bad), /outside Nigeria/);
  assert.match(geo.validatePolygon({ type: 'Point', coordinates: [7, 9] }), /Polygon/);
});

test('polygon area is accurate on the ellipsoid: 1 km x 1 km UTM square ≈ 100 ha', () => {
  const proj4 = require('proj4');
  const utm32 = proj4('+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs', 'WGS84');
  // UTM grid metres differ from ground metres by the point scale factor
  // (~0.99997 here), so the true area is ~100.006 ha; allow ±0.05 ha.
  const ring = [[335000, 1001000], [336000, 1001000], [336000, 1002000], [335000, 1002000], [335000, 1001000]].map((p) => utm32.forward(p));
  const ha = geo.polygonAreaHa({ type: 'Polygon', coordinates: [ring] });
  assert.ok(Math.abs(ha - 100) < 0.05, `got ${ha}`);
});
