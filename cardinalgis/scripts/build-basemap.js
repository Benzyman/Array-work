// Builds the offline base map data for CardinalGIS from open datasets:
//
//   data/nigeria-boundary.geojson  Nigeria's border (Natural Earth 1:10m) - used
//                                  for the "is this in Nigeria?" check
//   data/nigeria-basemap.json      neighbour borders, major rivers and lakes,
//                                  towns and state capitals - drawn on the map
//                                  when online map images are unavailable
//
// Sources (installed as devDependencies):
//   earth-topojson  Natural Earth 1:10m countries (public domain)
//   sane-topojson   Natural Earth 1:50m rivers and lakes (public domain)
//   cities.json     GeoNames towns (CC BY 4.0 - credit "GeoNames")
//
//   npm run build:basemap
const fs = require('fs');
const path = require('path');
const topojson = require('topojson-client');

const ROOT = path.join(__dirname, '..');
const admin = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'nigeria-admin.json'), 'utf8'));

// Area of interest: Nigeria plus a margin of its neighbours.
const VIEW = { minLng: 1.0, minLat: 3.0, maxLng: 16.0, maxLat: 15.5 };
const inView = ([lng, lat]) => lng >= VIEW.minLng && lng <= VIEW.maxLng && lat >= VIEW.minLat && lat <= VIEW.maxLat;
const round = (n) => Math.round(n * 1e4) / 1e4; // ~10 m, plenty for 1:10m data
const roundPt = ([lng, lat]) => [round(lng), round(lat)];

function distanceKm(lat1, lng1, lat2, lng2) {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng1) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

// Split a line into the runs of points that fall inside the view.
function clipLine(coords) {
  const parts = [];
  let current = [];
  for (const pt of coords) {
    if (inView(pt)) current.push(roundPt(pt));
    else if (current.length) { if (current.length > 1) parts.push(current); current = []; }
  }
  if (current.length > 1) parts.push(current);
  return parts;
}

// ---------- countries (1:10m) ----------
const world = require('earth-topojson/10m.json');
const countries = topojson.feature(world, world.objects.countries).features;
const byCode = (code) => countries.find((f) => f.properties.ADM0_A3 === code);

const nigeria = byCode('NGA');
const nigeriaGeometry = {
  type: 'MultiPolygon',
  coordinates: (nigeria.geometry.type === 'Polygon' ? [nigeria.geometry.coordinates] : nigeria.geometry.coordinates)
    .map((poly) => poly.map((ring) => ring.map(roundPt))),
};

const NEIGHBOURS = [['BEN', 'Benin'], ['NER', 'Niger'], ['TCD', 'Chad'], ['CMR', 'Cameroon']];
const neighbours = NEIGHBOURS.map(([code, name]) => {
  const g = byCode(code).geometry;
  const rings = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).map((poly) => poly[0]);
  const lines = rings.flatMap(clipLine);
  // Label at the average of the visible border points, nudged away from Nigeria.
  const pts = lines.flat();
  return { name, lines, label: [round(pts.reduce((s, p) => s + p[0], 0) / pts.length), round(pts.reduce((s, p) => s + p[1], 0) / pts.length)] };
});

// ---------- rivers and lakes (1:50m) ----------
const africa = require('sane-topojson/dist/africa_50m.json');
// The data has no river names, so a river is named only where its line passes
// within 15 km of a town that is known to stand on that river. (Lokoja is left
// out: both rivers meet there, so it cannot tell them apart.)
const RIVER_ANCHORS = [
  ['River Niger', 9.13, 4.83],   // Jebba
  ['River Niger', 6.15, 6.79],   // Onitsha
  ['River Benue', 7.73, 8.53],   // Makurdi
  ['River Benue', 9.21, 12.48],  // Yola
];
const rivers = [];
for (const f of topojson.feature(africa, africa.objects.rivers).features) {
  const lines = (f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates).flatMap(clipLine);
  if (!lines.length) continue;
  const pts = lines.flat();
  const anchor = RIVER_ANCHORS.find(([, lat, lng]) => pts.some(([x, y]) => distanceKm(lat, lng, y, x) < 15));
  rivers.push({ name: anchor ? anchor[0] : null, lines });
}

const LAKE_NAMES = [['Kainji Reservoir', 10.2, 4.55], ['Lake Chad', 13.1, 14.4]];
const lakes = [];
for (const f of topojson.feature(africa, africa.objects.lakes).features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    const ring = poly[0];
    if (!ring.some(inView)) continue;
    const named = LAKE_NAMES.find(([, lat, lng]) => ring.some(([x, y]) => distanceKm(lat, lng, y, x) < 40));
    lakes.push({ name: named ? named[0] : null, ring: ring.map(roundPt) });
  }
}

// ---------- towns (GeoNames) ----------
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
const allTowns = require('cities.json/cities.json').filter((c) => c.country === 'NG');
const capitalNames = new Map(admin.states.map((s) => [norm(s.capital), s.name]));

const seenCapital = new Set();
const towns = allTowns
  .map((c) => {
    const key = norm(c.name);
    let rank = 0; // 0 town, 1 state capital, 2 national capital
    if (key === 'abuja') rank = 2;
    else if (capitalNames.has(key) && !seenCapital.has(key)) { rank = 1; seenCapital.add(key); }
    return [c.name, round(Number(c.lat)), round(Number(c.lng)), rank];
  })
  .sort((a, b) => b[3] - a[3] || a[0].localeCompare(b[0]));

const missingCapitals = admin.states.filter((s) => s.capital !== 'Abuja' && !seenCapital.has(norm(s.capital))).map((s) => `${s.capital} (${s.name})`);

// ---------- write ----------
const boundary = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', id: 'NGA', properties: { name: 'Nigeria', source: 'Natural Earth 1:10m (public domain)' }, geometry: nigeriaGeometry }],
};
fs.writeFileSync(path.join(ROOT, 'data', 'nigeria-boundary.geojson'), JSON.stringify(boundary));

const basemap = {
  sources: 'Borders: Natural Earth 1:10m. Rivers and lakes: Natural Earth 1:50m (public domain). Towns: GeoNames (CC BY 4.0).',
  neighbours,
  rivers,
  lakes,
  towns,
};
fs.writeFileSync(path.join(ROOT, 'data', 'nigeria-basemap.json'), JSON.stringify(basemap));

const kb = (p) => (fs.statSync(path.join(ROOT, 'data', p)).size / 1024).toFixed(0) + ' KB';
console.log(`Nigeria border: ${nigeriaGeometry.coordinates.length} polygons, ${nigeriaGeometry.coordinates.flat(2).length} points (${kb('nigeria-boundary.geojson')})`);
console.log(`Rivers: ${rivers.length} (${rivers.map((r) => r.name || 'unnamed').join(', ')})`);
console.log(`Lakes: ${lakes.map((l) => l.name || 'unnamed').join(', ')}`);
console.log(`Towns: ${towns.length}, state capitals found: ${seenCapital.size}/36${missingCapitals.length ? ' - not in GeoNames list: ' + missingCapitals.join(', ') : ''}`);
console.log(`Wrote data/nigeria-basemap.json (${kb('nigeria-basemap.json')})`);
