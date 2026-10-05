// CardinalGIS offline demo: a stand-in for the server that runs in the browser.
//
// The real app talks to the Node server with fetch('/api/...'). In the demo we
// replace window.fetch so those requests are answered right here, using the
// same validation and Nigeria checks as the server (geo-core.js, records.js).
// Records are kept in this browser's localStorage (or in memory if blocked).
(function () {
  'use strict';

  const { boundary, admin, sampleSites, sampleArea } = window.CARDINAL_DATA;
  const constants = window.CardinalConstants;
  const geo = window.CardinalGeo(boundary, admin);
  const R = window.CardinalRecords(geo, constants);
  const KEY = 'cardinalgis-demo-v1';

  // ---------- storage ----------

  let memory = null;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* storage blocked or corrupt */ }
    return memory;
  }
  function save(db) {
    memory = db;
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* keep in memory only */ }
  }

  const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

  function seed() {
    const db = { nextSite: 1, nextArea: 1, sites: [], areas: [] };
    for (const s of sampleSites) insertSite(db, R.parseSite(s));
    insertArea(db, R.parseArea(sampleArea));
    return db;
  }

  function insertSite(db, site) {
    const row = { id: db.nextSite++, ...site, created_at: now(), updated_at: now() };
    db.sites.push(row);
    return row;
  }
  function insertArea(db, area) {
    const row = { id: db.nextArea++, ...area, created_at: now(), updated_at: now() };
    db.areas.push(row);
    return row;
  }

  let db = load();
  if (!db) { db = seed(); save(db); }

  window.CardinalDemo = {
    reset() { db = seed(); save(db); },
  };

  // ---------- queries ----------

  const newestFirst = (a, b) => (a.updated_at < b.updated_at ? 1 : a.updated_at > b.updated_at ? -1 : b.id - a.id);

  function listSites(q) {
    const term = (q.get('q') || '').toLowerCase().slice(0, 100);
    return db.sites.filter((s) =>
      (!q.get('state') || s.state === q.get('state')) &&
      (!q.get('mineral') || s.mineral === q.get('mineral')) &&
      (!q.get('status') || s.status === q.get('status')) &&
      (!term || [s.name, s.notes, s.lga, s.surveyor].some((v) => v && v.toLowerCase().includes(term))),
    ).sort(newestFirst).map((s) => ({ ...s }));
  }
  const listAreas = () => db.areas.slice().sort(newestFirst).map(R.areaRow);

  function stats() {
    const count = (key) => {
      const m = new Map();
      for (const s of db.sites) m.set(s[key], (m.get(s[key]) || 0) + 1);
      return [...m].map(([k, n]) => ({ [key]: k, count: n })).sort((a, b) => b.count - a.count);
    };
    return {
      sites: db.sites.length,
      areas: db.areas.length,
      totalAreaHa: db.areas.reduce((t, a) => t + a.area_ha, 0),
      byMineral: count('mineral'),
      byState: count('state'),
    };
  }

  // ---------- router ----------

  const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  const notFound = (what) => json({ error: `${what} not found` }, 404);

  function handle(method, url, body) {
    const p = url.pathname.replace(/^.*?\/api\//, '/');
    const q = url.searchParams;
    let m;

    if (method === 'GET' && p === '/health') return json({ ok: true });
    if (method === 'GET' && p === '/meta') {
      return json({
        minerals: constants.MINERALS, featureTypes: constants.FEATURE_TYPES, statuses: constants.STATUSES,
        licenceTypes: constants.LICENCE_TYPES, bbox: geo.NIGERIA_BBOX, editorRequired: false,
        states: geo.states.map(({ id, name, capital, zone, lat, lng, bbox }) => ({ id, name, capital, zone, lat, lng, bbox })),
      });
    }
    if (method === 'GET' && p === '/boundary') return json(geo.boundary);
    if (method === 'GET' && p === '/locate') {
      const loc = geo.locate(Number(q.get('lat')), Number(q.get('lng')));
      return loc.valid ? json(loc) : json({ error: 'lat and lng must be valid numbers' }, 400);
    }
    if (method === 'GET' && p === '/stats') return json(stats());

    // sites
    if (p === '/sites' && method === 'GET') return json(listSites(q));
    if (p === '/sites' && method === 'POST') { const row = insertSite(db, R.parseSite(body || {})); save(db); return json(row, 201); }
    if (p === '/sites/bulk' && method === 'POST') {
      const rows = Array.isArray(body && body.sites) ? body.sites : null;
      if (!rows) throw new R.ValidationError('send { "sites": [ ... ] }');
      const errors = [];
      let created = 0;
      rows.forEach((row, i) => {
        try { insertSite(db, R.parseSite(row || {})); created++; } catch (err) {
          if (!(err instanceof R.ValidationError)) throw err;
          errors.push({ row: i + 1, error: err.message });
        }
      });
      save(db);
      return json({ created, errors });
    }
    if ((m = p.match(/^\/sites\/(\d+)$/))) {
      const i = db.sites.findIndex((s) => s.id === Number(m[1]));
      if (i < 0) return notFound('Site');
      if (method === 'GET') return json(db.sites[i]);
      if (method === 'PUT') { db.sites[i] = { ...db.sites[i], ...R.parseSite(body || {}), updated_at: now() }; save(db); return json(db.sites[i]); }
      if (method === 'DELETE') { db.sites.splice(i, 1); save(db); return new Response(null, { status: 204 }); }
    }

    // areas
    if (p === '/areas' && method === 'GET') return json(listAreas());
    if (p === '/areas' && method === 'POST') { const row = insertArea(db, R.parseArea(body || {})); save(db); return json(R.areaRow(row), 201); }
    if ((m = p.match(/^\/areas\/(\d+)$/))) {
      const i = db.areas.findIndex((a) => a.id === Number(m[1]));
      if (i < 0) return notFound('Area');
      if (method === 'GET') return json(R.areaRow(db.areas[i]));
      if (method === 'PUT') { db.areas[i] = { ...db.areas[i], ...R.parseArea(body || {}), updated_at: now() }; save(db); return json(R.areaRow(db.areas[i])); }
      if (method === 'DELETE') { db.areas.splice(i, 1); save(db); return new Response(null, { status: 204 }); }
    }
    return json({ error: 'Not found' }, 404);
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = async function (input, init = {}) {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (!/\/api\//.test(url.pathname)) return realFetch(input, init);
    const method = (init.method || 'GET').toUpperCase();
    let body;
    if (init.body) {
      try { body = JSON.parse(init.body); } catch { return json({ error: 'Request body is not valid JSON' }, 400); }
    }
    try {
      return handle(method, url, body);
    } catch (err) {
      if (err instanceof R.ValidationError) return json({ error: err.message }, 400);
      console.error(err);
      return json({ error: 'Something went wrong in the demo' }, 500);
    }
  };

  // ---------- exports: the Data tab links point at /api/export/... ----------

  // Inside the claude.ai viewer (an iframe) downloads are blocked, so show the
  // file's text with a Copy button instead. Opened as a file, it downloads normally.
  const framed = (() => { try { return window.self !== window.top; } catch { return true; } })();

  function showFile(filename, content) {
    document.getElementById('file-title').textContent = 'Export ready';
    document.getElementById('file-name').textContent = filename;
    document.getElementById('file-text').value = content;
    document.getElementById('file-dialog').showModal();
  }

  // In the viewer, the `downloads` capability can save some file types after the
  // viewer confirms. Ask for it once, up front; it resolves null where unavailable.
  const viewerDownloads = framed && window.claude && window.claude.use
    ? window.claude.use('downloads').catch(() => null)
    : Promise.resolve(null);
  const VIEWER_TYPES = ['csv', 'json', 'txt'];

  async function saveInViewer(filename, content) {
    // .geojson is not on the viewer's list; the same content saves fine as .json.
    const name = filename.replace(/\.geojson$/, '.geojson.json');
    const ext = name.split('.').pop().toLowerCase();
    const dl = await viewerDownloads;
    if (!dl || !VIEWER_TYPES.includes(ext)) return showFile(filename, content);
    try {
      await dl.save({ filename: name, data: content });
    } catch (err) {
      if (err && (err.code === 'declined' || err.code === 'rate_limited')) return;
      showFile(filename, content);
    }
  }

  function download(filename, content, type) {
    if (framed) return saveInViewer(filename, content);
    const href = URL.createObjectURL(new Blob([content], { type }));
    const a = Object.assign(document.createElement('a'), { href, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="/api/export/"]');
    if (!link) return;
    e.preventDefault();
    const stamp = new Date().toISOString().slice(0, 10);
    const sites = listSites(new URLSearchParams());
    const kind = link.getAttribute('href').split('/').pop();
    if (kind === 'csv') download(`cardinalgis-sites-${stamp}.csv`, R.sitesToCsv(sites), 'text/csv');
    if (kind === 'geojson') download(`cardinalgis-${stamp}.geojson`, JSON.stringify(R.toGeoJson(sites, listAreas()), null, 2), 'application/geo+json');
    if (kind === 'kml') download(`cardinalgis-${stamp}.kml`, R.toKml(sites, listAreas()), 'application/vnd.google-earth.kml+xml');
  }, true);

  window.CardinalSaveFile = download;

  document.addEventListener('click', async (e) => {
    if (!e.target.closest('#file-copy')) return;
    const box = document.getElementById('file-text');
    try {
      await navigator.clipboard.writeText(box.value);
      e.target.closest('#file-copy').textContent = 'Copied';
    } catch {
      box.focus();
      box.select();
      e.target.closest('#file-copy').textContent = 'Press Ctrl+C to copy';
    }
  });

  // ---------- demo badge in the top bar ----------

  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.querySelector('.top-actions');
    if (!bar) return;
    const badge = document.createElement('div');
    badge.className = 'demo-badge';
    badge.innerHTML = '<span>Demo</span><button type="button" title="Delete your changes and reload the sample data">Reset</button>';
    badge.querySelector('button').addEventListener('click', async () => {
      const ok = await window.CardinalConfirm('Reset the demo?', 'Your changes in this browser will be replaced by the sample data.', 'Reset');
      if (!ok) return;
      window.CardinalDemo.reset();
      location.reload();
    });
    bar.prepend(badge);
  });
})();
