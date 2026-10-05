const test = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase } = require('../src/db');
const { createApp } = require('../src/app');

// Start the app on a random port with a throw-away in-memory database.
async function startServer(options = {}) {
  const app = createApp({ db: openDatabase(':memory:'), ...options });
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, body, headers = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const textBody = await res.text();
    let json = null;
    try { json = JSON.parse(textBody); } catch { /* not JSON */ }
    return { status: res.status, json, text: textBody, headers: res.headers };
  };
  return { call, close: () => new Promise((r) => server.close(r)) };
}

const JOS_SITE = { name: 'Bukuru tin pit', lat: 9.79, lng: 8.87, mineral: 'Tin (Cassiterite)', feature_type: 'Pit / Shaft', status: 'Artisanal' };

test('sites: create, read, update, filter, delete', async (t) => {
  const s = await startServer();
  t.after(s.close);

  const created = await s.call('POST', '/api/sites', JOS_SITE);
  assert.equal(created.status, 201);
  assert.equal(created.json.state, 'Plateau');
  assert.ok(created.json.lga);

  const list = await s.call('GET', '/api/sites?state=Plateau');
  assert.equal(list.json.length, 1);
  assert.equal((await s.call('GET', '/api/sites?state=Lagos')).json.length, 0);

  const updated = await s.call('PUT', `/api/sites/${created.json.id}`, { ...JOS_SITE, name: 'Renamed', status: 'Active' });
  assert.equal(updated.status, 200);
  assert.equal(updated.json.name, 'Renamed');

  assert.equal((await s.call('DELETE', `/api/sites/${created.json.id}`)).status, 204);
  assert.equal((await s.call('GET', `/api/sites/${created.json.id}`)).status, 404);
});

test('sites outside Nigeria and bad input are rejected', async (t) => {
  const s = await startServer();
  t.after(s.close);
  const cotonou = await s.call('POST', '/api/sites', { name: 'Cotonou', lat: 6.37, lng: 2.42 });
  assert.equal(cotonou.status, 400);
  assert.match(cotonou.json.error, /outside Nigeria/);
  assert.equal((await s.call('POST', '/api/sites', { lat: 9, lng: 8 })).status, 400); // no name
  assert.equal((await s.call('POST', '/api/sites', { ...JOS_SITE, mineral: 'Unobtainium' })).status, 400);
  assert.equal((await s.call('POST', '/api/sites', { ...JOS_SITE, survey_date: '31/01/2026' })).status, 400);
});

test('bulk import saves good rows and reports bad ones', async (t) => {
  const s = await startServer();
  t.after(s.close);
  const res = await s.call('POST', '/api/sites/bulk', { sites: [JOS_SITE, { name: 'Niamey', lat: 13.5, lng: 2.1 }, { ...JOS_SITE, name: 'Two' }] });
  assert.equal(res.json.created, 2);
  assert.equal(res.json.errors.length, 1);
  assert.equal(res.json.errors[0].row, 2);
});

test('areas: polygon saved with computed hectares and state', async (t) => {
  const s = await startServer();
  t.after(s.close);
  const geometry = { type: 'Polygon', coordinates: [[[7.49, 9.05], [7.5, 9.05], [7.5, 9.06], [7.49, 9.06]]] }; // unclosed on purpose
  const res = await s.call('POST', '/api/areas', { name: 'EL block A', licence_no: 'EL 1234', mineral: 'Gold', geometry });
  assert.equal(res.status, 201);
  assert.ok(res.json.area_ha > 120 && res.json.area_ha < 123);
  assert.equal(res.json.state, 'Federal Capital Territory');
  const ring = res.json.geometry.coordinates[0];
  assert.deepEqual(ring[0], ring[ring.length - 1], 'ring is closed by the server');

  const bad = await s.call('POST', '/api/areas', { name: 'Benin', geometry: { type: 'Polygon', coordinates: [[[2.40, 6.37], [2.45, 6.37], [2.45, 6.40]]] } });
  assert.equal(bad.status, 400);
});

test('exports: CSV, GeoJSON and KML', async (t) => {
  const s = await startServer();
  t.after(s.close);
  await s.call('POST', '/api/sites', { ...JOS_SITE, notes: '=HYPERLINK("x")', name: 'Pit "A", north' });
  const csv = await s.call('GET', '/api/export/csv');
  assert.match(csv.headers.get('content-type'), /text\/csv/);
  assert.match(csv.text, /"Pit ""A"", north"/);
  assert.match(csv.text, /'=HYPERLINK/, 'formula cells are neutralised');
  const gj = await s.call('GET', '/api/export/geojson');
  assert.equal(gj.json.type, 'FeatureCollection');
  assert.deepEqual(gj.json.features[0].geometry.coordinates, [8.87, 9.79]);
  const kml = await s.call('GET', '/api/export/kml');
  assert.match(kml.text, /<kml/);
  assert.match(kml.text, /Pit &quot;A&quot;, north/);
});

test('EDITOR_TOKEN protects writes but not reads', async (t) => {
  const s = await startServer({ editorToken: 'secret-key' });
  t.after(s.close);
  assert.equal((await s.call('POST', '/api/sites', JOS_SITE)).status, 401);
  assert.equal((await s.call('POST', '/api/sites', JOS_SITE, { Authorization: 'Bearer wrong' })).status, 401);
  assert.equal((await s.call('POST', '/api/sites', JOS_SITE, { Authorization: 'Bearer secret-key' })).status, 201);
  assert.equal((await s.call('GET', '/api/sites')).status, 200);
  assert.equal((await s.call('GET', '/api/meta')).json.editorRequired, true);
});

test('locate endpoint and static files', async (t) => {
  const s = await startServer();
  t.after(s.close);
  const loc = await s.call('GET', '/api/locate?lat=6.45&lng=3.39');
  assert.equal(loc.json.state, 'Lagos');
  assert.equal((await s.call('GET', '/api/locate?lat=abc&lng=3')).status, 400);
  const page = await s.call('GET', '/');
  assert.match(page.text, /CardinalGIS/);
  assert.equal((await s.call('GET', '/manifest.webmanifest')).json.name, 'CardinalGIS');
  assert.equal((await s.call('GET', '/vendor/inter/inter-latin-wght-normal.woff2')).status, 200);
  assert.equal((await s.call('GET', '/vendor/leaflet/leaflet.js')).status, 200);
  assert.equal((await s.call('GET', '/api/nope')).status, 404);
  const basemap = (await s.call('GET', '/api/basemap')).json;
  assert.ok(basemap.towns.length > 900);
  assert.ok(basemap.rivers.some((r) => r.name === 'River Benue'));
});

test('ownership: defaults, validation, filter, export', async (t) => {
  const s = await startServer();
  t.after(s.close);
  const plain = await s.call('POST', '/api/sites', JOS_SITE);
  assert.equal(plain.json.ownership, 'Not yet known');
  const gov = await s.call('POST', '/api/sites', { ...JOS_SITE, name: 'Gov pit', ownership: 'Government-owned' });
  assert.equal(gov.json.ownership, 'Government-owned');
  assert.equal((await s.call('POST', '/api/sites', { ...JOS_SITE, ownership: 'Mine' })).status, 400);
  const filtered = await s.call('GET', '/api/sites?ownership=' + encodeURIComponent('Government-owned'));
  assert.deepEqual(filtered.json.map((x) => x.name), ['Gov pit']);
  assert.match((await s.call('GET', '/api/export/csv')).text.split('\r\n')[0], /,status,ownership,/);
  const geometry = { type: 'Polygon', coordinates: [[[7.49, 9.05], [7.5, 9.05], [7.5, 9.06], [7.49, 9.05]]] };
  const area = await s.call('POST', '/api/areas', { name: 'Private block', ownership: 'Privately owned', geometry });
  assert.equal(area.json.ownership, 'Privately owned');
  const stats = await s.call('GET', '/api/stats');
  assert.equal(stats.json.byOwnership.length, 2);
});

test('an older database without the ownership column is upgraded', () => {
  const { DatabaseSync } = require('node:sqlite');
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cgis-')), 'old.db');
  const old = new DatabaseSync(file);
  old.exec(`CREATE TABLE sites (id INTEGER PRIMARY KEY, name TEXT NOT NULL, feature_type TEXT, mineral TEXT, status TEXT,
    lat REAL, lng REAL, elevation_m REAL, accuracy_m REAL, state TEXT, lga TEXT, surveyor TEXT, survey_date TEXT, notes TEXT,
    created_at TEXT, updated_at TEXT)`);
  old.exec("INSERT INTO sites (name, lat, lng) VALUES ('Old site', 9.79, 8.87)");
  old.close();
  const db = openDatabase(file);
  assert.equal(db.prepare('SELECT ownership FROM sites').get().ownership, 'Not yet known');
});
