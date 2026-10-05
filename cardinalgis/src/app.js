// The Express application: JSON API + static web app.
// server.js starts it; tests create it directly with an in-memory database.
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const geo = require('./geo');
const { MINERALS, FEATURE_TYPES, STATUSES, LICENCE_TYPES } = require('./constants');

const ROOT = path.join(__dirname, '..');

// ---------- small validation helpers ----------

class ValidationError extends Error {}

function text(value, field, { required = false, max = 200 } = {}) {
  if (value === undefined || value === null || String(value).trim() === '') {
    if (required) throw new ValidationError(`${field} is required`);
    return null;
  }
  const s = String(value).trim();
  if (s.length > max) throw new ValidationError(`${field} must be at most ${max} characters`);
  return s;
}

function number(value, field, { required = false, min = -Infinity, max = Infinity } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ValidationError(`${field} is required`);
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new ValidationError(`${field} must be a number between ${min} and ${max}`);
  return n;
}

function oneOf(value, field, list, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (!list.includes(value)) throw new ValidationError(`${field} must be one of: ${list.join(', ')}`);
  return value;
}

function isoDate(value, field) {
  const s = text(value, field, { max: 10 });
  if (s === null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) throw new ValidationError(`${field} must be a date like 2026-01-31`);
  return s;
}

// Turn request JSON into a clean site record. State and LGA are always
// worked out on the server from the coordinates, never trusted from the client.
function parseSite(body) {
  const lat = number(body.lat, 'lat', { required: true, min: -90, max: 90 });
  const lng = number(body.lng, 'lng', { required: true, min: -180, max: 180 });
  const loc = geo.locate(lat, lng);
  if (!loc.accepted) throw new ValidationError(`Coordinate ${lat.toFixed(6)}, ${lng.toFixed(6)} is outside Nigeria. Only Nigerian locations can be recorded.`);
  return {
    name: text(body.name, 'name', { required: true, max: 120 }),
    feature_type: oneOf(body.feature_type, 'feature_type', FEATURE_TYPES, 'Mine site'),
    mineral: oneOf(body.mineral, 'mineral', MINERALS, 'Other'),
    status: oneOf(body.status, 'status', STATUSES, 'Exploration'),
    lat: Math.round(lat * 1e7) / 1e7,
    lng: Math.round(lng * 1e7) / 1e7,
    elevation_m: number(body.elevation_m, 'elevation_m', { min: -100, max: 3000 }),
    accuracy_m: number(body.accuracy_m, 'accuracy_m', { min: 0, max: 100000 }),
    state: loc.state,
    lga: loc.lga,
    surveyor: text(body.surveyor, 'surveyor', { max: 120 }),
    survey_date: isoDate(body.survey_date, 'survey_date'),
    notes: text(body.notes, 'notes', { max: 2000 }),
  };
}

function parseArea(body) {
  let geometry = body.geometry;
  if (typeof geometry === 'string') {
    try { geometry = JSON.parse(geometry); } catch { throw new ValidationError('geometry is not valid JSON'); }
  }
  const problem = geo.validatePolygon(geometry);
  if (problem) throw new ValidationError(problem);
  // Make sure every ring is closed (first point == last point).
  const coordinates = geometry.coordinates.map((ring) => {
    const r = ring.map(([lng, lat]) => [Math.round(Number(lng) * 1e7) / 1e7, Math.round(Number(lat) * 1e7) / 1e7]);
    const [f, l] = [r[0], r[r.length - 1]];
    if (f[0] !== l[0] || f[1] !== l[1]) r.push([...f]);
    return r;
  });
  const clean = { type: 'Polygon', coordinates };
  const centre = geo.polygonCentroid(clean);
  const loc = geo.locate(centre.lat, centre.lng);
  return {
    name: text(body.name, 'name', { required: true, max: 120 }),
    licence_type: oneOf(body.licence_type, 'licence_type', LICENCE_TYPES, LICENCE_TYPES[1]),
    licence_no: text(body.licence_no, 'licence_no', { max: 60 }),
    holder: text(body.holder, 'holder', { max: 160 }),
    mineral: oneOf(body.mineral, 'mineral', MINERALS, 'Other'),
    geometry: JSON.stringify(clean),
    area_ha: Math.round(geo.polygonAreaHa(clean) * 10000) / 10000,
    state: loc.state,
    lga: loc.lga,
    notes: text(body.notes, 'notes', { max: 2000 }),
  };
}

function areaRow(row) {
  return row && { ...row, geometry: JSON.parse(row.geometry) };
}

// ---------- export formats ----------

function csvCell(v) {
  if (v === null || v === undefined) return '';
  let s = String(v);
  // Stop spreadsheet apps from running cells as formulas.
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const SITE_COLUMNS = ['id', 'name', 'feature_type', 'mineral', 'status', 'lat', 'lng', 'elevation_m', 'accuracy_m', 'state', 'lga', 'surveyor', 'survey_date', 'notes', 'created_at', 'updated_at'];

function sitesToCsv(sites) {
  const lines = [SITE_COLUMNS.join(',')];
  for (const s of sites) lines.push(SITE_COLUMNS.map((c) => csvCell(s[c])).join(','));
  return lines.join('\r\n') + '\r\n';
}

function xml(s) {
  return String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

function toKml(sites, areas) {
  const desc = (obj, keys) => keys.filter((k) => obj[k] !== null && obj[k] !== undefined).map((k) => `${k}: ${obj[k]}`).join('\n');
  const placemarks = [
    ...sites.map((s) => `    <Placemark><name>${xml(s.name)}</name><description>${xml(desc(s, ['feature_type', 'mineral', 'status', 'state', 'lga', 'surveyor', 'survey_date', 'notes']))}</description><Point><coordinates>${s.lng},${s.lat}${s.elevation_m != null ? ',' + s.elevation_m : ''}</coordinates></Point></Placemark>`),
    ...areas.map((a) => {
      const rings = a.geometry.coordinates.map((ring, i) => {
        const tag = i === 0 ? 'outerBoundaryIs' : 'innerBoundaryIs';
        return `<${tag}><LinearRing><coordinates>${ring.map(([x, y]) => `${x},${y}`).join(' ')}</coordinates></LinearRing></${tag}>`;
      }).join('');
      return `    <Placemark><name>${xml(a.name)}</name><description>${xml(desc(a, ['licence_type', 'licence_no', 'holder', 'mineral', 'area_ha', 'state', 'lga', 'notes']))}</description><Polygon>${rings}</Polygon></Placemark>`;
    }),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n  <Document>\n    <name>CardinalGIS export</name>\n${placemarks.join('\n')}\n  </Document>\n</kml>\n`;
}

function toGeoJson(sites, areas) {
  return {
    type: 'FeatureCollection',
    features: [
      ...sites.map(({ lat, lng, ...props }) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: { layer: 'site', ...props } })),
      ...areas.map(({ geometry, ...props }) => ({ type: 'Feature', geometry, properties: { layer: 'area', ...props } })),
    ],
  };
}

// ---------- the app ----------

function createApp({ db, editorToken = '' } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));

  // Basic security headers. Map tiles come from third-party https servers.
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'self'",
    });
    next();
  });

  // Optional write protection: if EDITOR_TOKEN is set, anything that
  // changes data must send "Authorization: Bearer <token>". Reading stays public.
  function requireEditor(req, res, next) {
    if (!editorToken) return next();
    const header = req.get('authorization') || '';
    const given = Buffer.from(header.replace(/^Bearer\s+/i, ''));
    const expected = Buffer.from(editorToken);
    if (given.length === expected.length && crypto.timingSafeEqual(given, expected)) return next();
    return res.status(401).json({ error: 'Editor key required to make changes. Enter it under Data → Editor key.' });
  }

  const api = express.Router();

  api.get('/health', (req, res) => res.json({ ok: true }));

  api.get('/meta', (req, res) => {
    res.json({
      minerals: MINERALS,
      featureTypes: FEATURE_TYPES,
      statuses: STATUSES,
      licenceTypes: LICENCE_TYPES,
      states: geo.states.map(({ id, name, capital, zone, lat, lng, bbox }) => ({ id, name, capital, zone, lat, lng, bbox })),
      bbox: geo.NIGERIA_BBOX,
      editorRequired: Boolean(editorToken),
    });
  });

  api.get('/boundary', (req, res) => res.json(geo.boundary));

  api.get('/locate', (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const loc = geo.locate(lat, lng);
    if (!loc.valid) return res.status(400).json({ error: 'lat and lng must be valid numbers' });
    res.json(loc);
  });

  // ----- sites -----
  function listSites(query) {
    const where = [];
    const params = [];
    if (query.state) { where.push('state = ?'); params.push(String(query.state)); }
    if (query.mineral) { where.push('mineral = ?'); params.push(String(query.mineral)); }
    if (query.status) { where.push('status = ?'); params.push(String(query.status)); }
    if (query.q) {
      where.push('(name LIKE ? OR notes LIKE ? OR lga LIKE ? OR surveyor LIKE ?)');
      const like = `%${String(query.q).slice(0, 100)}%`;
      params.push(like, like, like, like);
    }
    const sql = `SELECT * FROM sites ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY updated_at DESC, id DESC`;
    return db.prepare(sql).all(...params);
  }

  const insertSite = db.prepare(`INSERT INTO sites (name, feature_type, mineral, status, lat, lng, elevation_m, accuracy_m, state, lga, surveyor, survey_date, notes)
    VALUES (:name, :feature_type, :mineral, :status, :lat, :lng, :elevation_m, :accuracy_m, :state, :lga, :surveyor, :survey_date, :notes)`);
  const getSite = db.prepare('SELECT * FROM sites WHERE id = ?');

  api.get('/sites', (req, res) => res.json(listSites(req.query)));

  api.get('/sites/:id', (req, res) => {
    const row = getSite.get(Number(req.params.id));
    if (!row) return res.status(404).json({ error: 'Site not found' });
    res.json(row);
  });

  api.post('/sites', requireEditor, (req, res) => {
    const site = parseSite(req.body || {});
    const { lastInsertRowid } = insertSite.run(site);
    res.status(201).json(getSite.get(lastInsertRowid));
  });

  // Bulk import (used by the CSV importer). Good rows are saved, bad rows reported.
  api.post('/sites/bulk', requireEditor, (req, res) => {
    const rows = Array.isArray(req.body?.sites) ? req.body.sites : null;
    if (!rows) throw new ValidationError('send { "sites": [ ... ] }');
    if (rows.length > 5000) throw new ValidationError('at most 5000 rows per import');
    const errors = [];
    let created = 0;
    db.exec('BEGIN');
    try {
      rows.forEach((row, i) => {
        try {
          insertSite.run(parseSite(row || {}));
          created++;
        } catch (err) {
          if (!(err instanceof ValidationError)) throw err;
          errors.push({ row: i + 1, error: err.message });
        }
      });
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    res.json({ created, errors });
  });

  api.put('/sites/:id', requireEditor, (req, res) => {
    const id = Number(req.params.id);
    if (!getSite.get(id)) return res.status(404).json({ error: 'Site not found' });
    const site = parseSite(req.body || {});
    db.prepare(`UPDATE sites SET name=:name, feature_type=:feature_type, mineral=:mineral, status=:status, lat=:lat, lng=:lng,
      elevation_m=:elevation_m, accuracy_m=:accuracy_m, state=:state, lga=:lga, surveyor=:surveyor, survey_date=:survey_date,
      notes=:notes, updated_at=datetime('now') WHERE id=:id`).run({ ...site, id });
    res.json(getSite.get(id));
  });

  api.delete('/sites/:id', requireEditor, (req, res) => {
    const { changes } = db.prepare('DELETE FROM sites WHERE id = ?').run(Number(req.params.id));
    if (!changes) return res.status(404).json({ error: 'Site not found' });
    res.status(204).end();
  });

  // ----- areas (polygons) -----
  const getArea = db.prepare('SELECT * FROM areas WHERE id = ?');
  const listAreas = () => db.prepare('SELECT * FROM areas ORDER BY updated_at DESC, id DESC').all().map(areaRow);

  api.get('/areas', (req, res) => res.json(listAreas()));

  api.get('/areas/:id', (req, res) => {
    const row = getArea.get(Number(req.params.id));
    if (!row) return res.status(404).json({ error: 'Area not found' });
    res.json(areaRow(row));
  });

  api.post('/areas', requireEditor, (req, res) => {
    const area = parseArea(req.body || {});
    const { lastInsertRowid } = db.prepare(`INSERT INTO areas (name, licence_type, licence_no, holder, mineral, geometry, area_ha, state, lga, notes)
      VALUES (:name, :licence_type, :licence_no, :holder, :mineral, :geometry, :area_ha, :state, :lga, :notes)`).run(area);
    res.status(201).json(areaRow(getArea.get(lastInsertRowid)));
  });

  api.put('/areas/:id', requireEditor, (req, res) => {
    const id = Number(req.params.id);
    if (!getArea.get(id)) return res.status(404).json({ error: 'Area not found' });
    const area = parseArea(req.body || {});
    db.prepare(`UPDATE areas SET name=:name, licence_type=:licence_type, licence_no=:licence_no, holder=:holder, mineral=:mineral,
      geometry=:geometry, area_ha=:area_ha, state=:state, lga=:lga, notes=:notes, updated_at=datetime('now') WHERE id=:id`).run({ ...area, id });
    res.json(areaRow(getArea.get(id)));
  });

  api.delete('/areas/:id', requireEditor, (req, res) => {
    const { changes } = db.prepare('DELETE FROM areas WHERE id = ?').run(Number(req.params.id));
    if (!changes) return res.status(404).json({ error: 'Area not found' });
    res.status(204).end();
  });

  // ----- summary + exports -----
  api.get('/stats', (req, res) => {
    res.json({
      sites: db.prepare('SELECT COUNT(*) AS n FROM sites').get().n,
      areas: db.prepare('SELECT COUNT(*) AS n FROM areas').get().n,
      totalAreaHa: db.prepare('SELECT COALESCE(SUM(area_ha), 0) AS n FROM areas').get().n,
      byMineral: db.prepare('SELECT mineral, COUNT(*) AS count FROM sites GROUP BY mineral ORDER BY count DESC').all(),
      byState: db.prepare('SELECT state, COUNT(*) AS count FROM sites GROUP BY state ORDER BY count DESC').all(),
    });
  });

  const stamp = () => new Date().toISOString().slice(0, 10);

  api.get('/export/csv', (req, res) => {
    res.type('text/csv').attachment(`cardinalgis-sites-${stamp()}.csv`).send(sitesToCsv(listSites(req.query)));
  });

  api.get('/export/geojson', (req, res) => {
    res.type('application/geo+json').attachment(`cardinalgis-${stamp()}.geojson`).send(JSON.stringify(toGeoJson(listSites(req.query), listAreas()), null, 2));
  });

  api.get('/export/kml', (req, res) => {
    res.type('application/vnd.google-earth.kml+xml').attachment(`cardinalgis-${stamp()}.kml`).send(toKml(listSites(req.query), listAreas()));
  });

  api.use((req, res) => res.status(404).json({ error: 'Not found' }));

  app.use('/api', api);

  // Front-end files and the map libraries straight from node_modules.
  app.use('/vendor/leaflet', express.static(path.join(ROOT, 'node_modules', 'leaflet', 'dist')));
  app.use('/vendor/leaflet-draw', express.static(path.join(ROOT, 'node_modules', 'leaflet-draw', 'dist')));
  app.use('/vendor/proj4', express.static(path.join(ROOT, 'node_modules', 'proj4', 'dist')));
  app.use('/vendor/inter', express.static(path.join(ROOT, 'node_modules', '@fontsource-variable', 'inter', 'files')));
  // The service worker must never be served stale, or app updates would not reach users.
  app.get('/sw.js', (req, res, next) => { res.set('Cache-Control', 'no-cache'); next(); });
  app.use(express.static(path.join(ROOT, 'public')));

  // Error handler: validation problems -> 400, bad JSON -> 400, anything else -> 500.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server' });
  });

  return app;
}

module.exports = { createApp, sitesToCsv, toKml, toGeoJson };
