// Coordinate entry must cope with values typed or pasted from documents, chats and GPS apps.
const test = require('node:test');
const assert = require('node:assert/strict');
globalThis.proj4 = require('proj4');
require('../public/js/coords.js');
const C = globalThis.Coords;

const near = (a, b) => Math.abs(a - b) < 1e-4;

test('decimal degrees with stray symbols, commas, hemisphere letters', () => {
  const abuja = { lat: 9.027, lng: 7.5185 };
  for (const [a, b] of [
    ['9.027000', '• 7.518500'], // bullet pasted from a list
    ['9,027', '7,5185'], // comma as decimal point
    ['9.027°N', '7.5185°E'],
    ['N 9.027', 'E 7.5185'],
    [' 9.027 ', '7.5185 '],
  ]) {
    const r = C.readInput('DD', a, b);
    assert.ok(near(r.lat, abuja.lat) && near(r.lng, abuja.lng), `${a} / ${b}`);
  }
  assert.ok(near(C.readInput('DD', '−9.027', '7.5').lat, -9.027), 'typographic minus');
  assert.ok(near(C.readInput('DD', '9.027 S', '7.5').lat, -9.027), 'S means south');
});

test('degrees-minutes-seconds typed into the decimal box are understood', () => {
  const r = C.readInput('DD', `9°01'37"N`, `7°31'07"E`);
  assert.ok(near(r.lat, 9 + 1 / 60 + 37 / 3600) && near(r.lng, 7 + 31 / 60 + 7 / 3600));
});

test('easting/northing with thousands separators', () => {
  const a = C.readInput('EPSG:32632', '335,000.00', '1,001,000.00');
  const b = C.readInput('EPSG:32632', '335000', '1001000');
  assert.ok(near(a.lat, b.lat) && near(a.lng, b.lng));
});

test('clear messages for real mistakes', () => {
  assert.throws(() => C.readInput('DD', 'abc', '7.5'), /Latitude "abc" is not a coordinate/);
  assert.throws(() => C.readInput('DD', '9.0', ''), /Enter the longitude/);
  assert.throws(() => C.readInput('DD', '95', '7'), /between -90 and 90/);
  assert.throws(() => C.readInput('EPSG:32632', '335000', 'x'), /Northing "x"/);
});
