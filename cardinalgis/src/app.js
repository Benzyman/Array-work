// The Express application: JSON API + static web app.
// server.js starts it; tests create it directly with an in-memory database.
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const geo = require('./geo');
const constants = require('./constants');
const createRecords = require('./records');

const { MINERALS, FEATURE_TYPES, STATUSES, LICENCE_TYPES } = constants;
const { ValidationError, parseSite, parseArea, areaRow, sitesToCsv, toKml, toGeoJson } = createRecords(geo, constants);

const ROOT = path.join(__dirname, '..');

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
