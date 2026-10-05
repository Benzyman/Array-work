// CardinalGIS – browser app.
// Talks to the JSON API in src/app.js and draws everything with Leaflet.
(function () {
  'use strict';

  const C = window.Coords;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    meta: null,
    sites: [],
    areas: [],
    mode: null, // null | 'pick-site' | 'draw-area' | 'measure' | 'edit-shape'
    drawHandler: null,
    editingLayer: null,
    editingArea: null,
    lastConverted: null,
  };

  // ---------- helpers ----------

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function storage(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
    } catch { /* private mode etc. */ }
    return null;
  }

  function isDarkTheme() {
    const t = document.documentElement.dataset.theme;
    return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  let toastTimer;
  function toast(message, bad = false) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.toggle('bad', bad);
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), bad ? 5000 : 2800);
  }

  async function api(method, url, body) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const key = storage('editorKey');
    if (key && method !== 'GET') headers.Authorization = 'Bearer ' + key;
    const res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  const MINERAL_COLOURS = {
    'Gold': '#d4a017', 'Lead/Zinc': '#5b6c80', 'Tin (Cassiterite)': '#8d99a6', 'Columbite': '#3d3d3d',
    'Tantalite': '#7b4f9d', 'Lithium': '#e0559b', 'Barite': '#4fb0c6', 'Limestone': '#c8b98a',
    'Iron Ore': '#b5452b', 'Coal': '#111111', 'Bitumen': '#4a3728', 'Gemstones': '#1fa67a',
    'Kaolin': '#f2efe6', 'Gypsum': '#e8d9b5', 'Granite': '#a3746b', 'Marble': '#dfe6ec',
    'Bentonite': '#9bb36d', 'Feldspar': '#f0b08a', 'Mica': '#c0c9cf', 'Talc': '#bfe3d4',
    'Silica Sand': '#f5d77a', 'Laterite': '#c1440e', 'Other': '#2f80ed',
  };
  const colourFor = (mineral) => MINERAL_COLOURS[mineral] || '#2f80ed';

  // Ownership is shown as the coloured edge (ring) of each pin and the outline of each area.
  const OWNERSHIP_COLOURS = {
    'Government-owned': '#1f5fd6',
    'Privately owned': '#e06c00',
    'Untouched / unclaimed': '#14a05a',
    'Not yet known': '#8a93a3',
  };
  const ownershipOf = (x) => x.ownership || 'Not yet known';
  const ownColour = (x) => OWNERSHIP_COLOURS[ownershipOf(x)] || OWNERSHIP_COLOURS['Not yet known'];
  const ownChip = (x) => `<span class="chip own" style="color:${ownColour(x)}"><i style="background:${ownColour(x)}"></i>${esc(ownershipOf(x))}</span>`;

  function fmtHa(ha) {
    return ha >= 100 ? `${ha.toLocaleString('en-NG', { maximumFractionDigits: 1 })} ha (${(ha / 100).toFixed(2)} km²)` : `${ha.toFixed(3)} ha`;
  }

  function perimeterM(latlngs) {
    let d = 0;
    for (let i = 0; i < latlngs.length; i++) d += L.latLng(latlngs[i]).distanceTo(latlngs[(i + 1) % latlngs.length]);
    return d;
  }

  function latlngsToGeometry(latlngs) {
    const ring = latlngs.map((p) => [p.lng, p.lat]);
    ring.push([...ring[0]]);
    return { type: 'Polygon', coordinates: [ring] };
  }

  function geometryToLatLngs(geometry) {
    return geometry.coordinates.map((ring) => ring.slice(0, -1).map(([lng, lat]) => L.latLng(lat, lng)));
  }

  // In-app replacement for window.confirm(): resolves true when the user confirms.
  function askConfirm(title, text, okLabel = 'Delete') {
    const dlg = $('#confirm-dialog');
    $('#confirm-title').textContent = title;
    $('#confirm-text').textContent = text;
    $('#confirm-yes').textContent = okLabel;
    dlg.showModal();
    return new Promise((resolve) => {
      const done = (answer) => {
        $('#confirm-yes').onclick = null;
        $('#confirm-no').onclick = null;
        dlg.onclose = null;
        if (dlg.open) dlg.close();
        resolve(answer);
      };
      $('#confirm-yes').onclick = (e) => { e.preventDefault(); done(true); };
      $('#confirm-no').onclick = () => done(false);
      dlg.onclose = () => done(false);
    });
  }
  window.CardinalConfirm = askConfirm;

  function download(filename, content, type) {
    if (window.CardinalSaveFile) return window.CardinalSaveFile(filename, content, type);
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------- map ----------

  const NIGERIA_VIEW = [[4.2, 2.7], [13.9, 14.7]];
  const map = L.map('map', {
    maxBounds: [[1.5, -0.5], [16.5, 18]],
    maxBoundsViscosity: 0.9,
    minZoom: 5,
    zoomControl: true,
  });
  map.fitBounds(NIGERIA_VIEW);

  // Base maps. The Esri (ArcGIS) layers are the same maps ArcGIS uses: the
  // Topographic map shows rivers, lakes, state and country borders, roads,
  // railways, towns and terrain. "Satellite + labels" lays Esri's borders,
  // place names and roads over the satellite photo.
  const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
  const esriTiles = (service, attribution, opts = {}) =>
    L.tileLayer(`${ESRI}${service}/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 19, attribution, ...opts });
  const ESRI_CREDIT = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, FAO, NOAA, USGS, &copy; OpenStreetMap contributors, and the GIS User Community';
  const CARTO = '&copy; OpenStreetMap contributors &copy; CARTO';

  const satellite = esriTiles('World_Imagery', 'Imagery &copy; Esri, Maxar, Earthstar Geographics');
  const tileLayers = {
    topo: esriTiles('World_Topo_Map', ESRI_CREDIT),
    street: esriTiles('World_Street_Map', ESRI_CREDIT),
    satellite,
    satelliteLabels: L.layerGroup([
      esriTiles('World_Imagery', 'Imagery &copy; Esri, Maxar, Earthstar Geographics'),
      esriTiles('Reference/World_Transportation', ESRI_CREDIT, { opacity: 0.85 }),
      esriTiles('Reference/World_Boundaries_and_Places', ESRI_CREDIT),
    ]),
    light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 20, subdomains: 'abcd', attribution: CARTO }),
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20, subdomains: 'abcd', attribution: CARTO }),
  };
  const baseLayers = {
    'Topographic (Esri)': tileLayers.topo,
    'Streets (Esri)': tileLayers.street,
    'Satellite + labels (Esri)': tileLayers.satelliteLabels,
    'Satellite only (Esri)': tileLayers.satellite,
    'Light': tileLayers.light,
    'Dark': tileLayers.dark,
  };
  const savedBase = storage('baseLayer');
  baseLayers[savedBase in baseLayers ? savedBase : 'Topographic (Esri)'].addTo(map);
  map.on('baselayerchange', (e) => storage('baseLayer', e.name));

  // If map images can't be downloaded (no internet, blocked network) say so once,
  // instead of leaving a blank map. The outline, state names and data still work.
  let tileLoads = 0, tileErrors = 0, tileWarned = false;
  const everyTileLayer = [];
  Object.values(baseLayers).forEach((layer) => (layer.eachLayer ? layer.eachLayer((l) => everyTileLayer.push(l)) : everyTileLayer.push(layer)));
  everyTileLayer.forEach((layer) => {
    layer.on('tileload', () => { tileLoads++; });
    layer.on('tileerror', () => {
      if (++tileErrors >= 6 && tileLoads === 0 && !tileWarned) {
        tileWarned = true;
        toast('Map images need internet, so the built-in offline map is shown: borders, major rivers, lakes and towns.', true);
        if (!map.hasLayer(referenceLayer)) referenceLayer.addTo(map);
      }
    });
  });

  const sitesLayer = L.featureGroup().addTo(map);
  const areasLayer = L.featureGroup().addTo(map);
  const tempLayer = L.featureGroup().addTo(map);
  const stateLabels = L.layerGroup().addTo(map);
  // Offline reference map (drawn by drawReferenceMap below).
  const referenceLayer = L.layerGroup();
  referenceLayer.getAttribution = () => 'Offline map: Natural Earth, GeoNames (CC BY 4.0)';
  const capitalLayer = L.layerGroup().addTo(referenceLayer);  // state capitals + Abuja
  const townLayer = L.layerGroup();                            // other towns, added when zoomed in
  const canvas = L.canvas({ padding: 0.3 });
  L.control.layers(baseLayers, {
    'Sites': sitesLayer,
    'Licence areas': areasLayer,
    'State names': stateLabels,
    'Offline map: rivers, lakes, towns': referenceLayer,
  }, { position: 'topright' }).addTo(map);

  // State names at each state's centre, from the built-in data (works offline).
  function addStateLabels(states) {
    for (const st of states) {
      const name = st.name === 'Federal Capital Territory' ? 'FCT' : st.name;
      L.marker([st.lat, st.lng], {
        interactive: false, keyboard: false,
        icon: L.divIcon({ className: 'state-label', html: `<span>${esc(name)}</span>`, iconSize: null }),
      }).addTo(stateLabels);
    }
  }
  // Show them between zoom 6 and 9: further out they overlap, closer in they get in the way.
  function updateLabelZoom() {
    const z = map.getZoom();
    map.getContainer().classList.toggle('labels-off', z < 6 || z > 9);
    // Capitals: dots always, names from zoom 7. Other towns: from zoom 8, names from zoom 9.
    map.getContainer().classList.toggle('towns-off', z < 7);
    map.getContainer().classList.toggle('small-towns-off', z < 9);
    if (z >= 8 && !referenceLayer.hasLayer(townLayer)) referenceLayer.addLayer(townLayer);
    if (z < 8 && referenceLayer.hasLayer(townLayer)) referenceLayer.removeLayer(townLayer);
  }
  map.on('zoomend', updateLabelZoom);
  updateLabelZoom();
  L.control.scale({ imperial: false }).addTo(map);

  // North arrow
  const north = L.control({ position: 'topleft' });
  north.onAdd = () => {
    const el = L.DomUtil.create('div', 'north leaflet-control');
    el.title = 'North';
    el.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2l5 18-5-4-5 4z" fill="#c8102e"/><path d="M12 2v14l-5 4z" fill="#8a1023"/></svg>';
    return el;
  };
  north.addTo(map);

  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = () => L.DomUtil.create('div', 'legend');
  legend.addTo(map);

  // Grey out everything outside Nigeria so it is obvious where data can go.
  async function drawBoundary() {
    const geojson = await api('GET', '/api/boundary');
    const g = geojson.features[0].geometry;
    const polygons = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    const outers = polygons.map((poly) => poly[0].map(([lng, lat]) => [lat, lng]));
    const world = [[-89, -179], [-89, 179], [89, 179], [89, -179]];
    L.polygon([world, ...outers], { stroke: false, fillColor: '#0d0f13', fillOpacity: 0.4, interactive: false }).addTo(map);
    L.polygon(outers, { color: '#c8102e', weight: 2, opacity: 0.85, fill: false, interactive: false, dashArray: '7 5' }).addTo(map);
  }

  // ---------- offline reference map: rivers, lakes, towns, neighbours ----------
  // Built from open data shipped with the app (Natural Earth + GeoNames), so it
  // works with no internet. It switches on by itself if map images fail to load.

  async function drawReferenceMap() {
    const b = await api('GET', '/api/basemap');
    const ll = (line) => line.map(([lng, lat]) => [lat, lng]);
    for (const n of b.neighbours) {
      n.lines.forEach((line) => L.polyline(ll(line), { color: '#6b7280', weight: 1.5, dashArray: '6 3 1 3', interactive: false, renderer: canvas }).addTo(referenceLayer));
      L.marker([n.label[1], n.label[0]], { interactive: false, keyboard: false, icon: L.divIcon({ className: 'country-label', html: `<span>${esc(n.name.toUpperCase())}</span>`, iconSize: null }) }).addTo(referenceLayer);
    }
    for (const lake of b.lakes) {
      L.polygon(ll(lake.ring), { color: '#3b82c4', weight: 1, fillColor: '#9cc9ee', fillOpacity: 0.85, interactive: false, renderer: canvas }).addTo(referenceLayer);
      if (lake.name) {
        const c = L.polygon(ll(lake.ring)).getBounds().getCenter();
        L.marker(c, { interactive: false, keyboard: false, icon: L.divIcon({ className: 'water-label', html: `<span>${esc(lake.name)}</span>`, iconSize: null }) }).addTo(referenceLayer);
      }
    }
    const labelled = new Set();
    for (const river of b.rivers) {
      for (const line of river.lines) {
        L.polyline(ll(line), { color: '#3b82c4', weight: river.name ? 3 : 2, opacity: 0.9, interactive: false, renderer: canvas }).addTo(referenceLayer);
      }
      // One label per river, on the middle of its longest stretch inside Nigeria's view.
      if (river.name && !labelled.has(river.name)) {
        labelled.add(river.name);
        const longest = river.lines.reduce((a, l) => (l.length > a.length ? l : a), []);
        const mid = longest[Math.floor(longest.length / 2)];
        L.marker([mid[1], mid[0]], { interactive: false, keyboard: false, icon: L.divIcon({ className: 'water-label', html: `<span>${esc(river.name)}</span>`, iconSize: null }) }).addTo(referenceLayer);
      }
    }
    // Towns: [name, lat, lng, rank] with rank 2 = national capital, 1 = state capital.
    for (const [name, lat, lng, rank] of b.towns) {
      const cls = rank === 2 ? 'town-label national' : rank === 1 ? 'town-label capital' : 'town-label';
      L.circleMarker([lat, lng], {
        renderer: canvas, radius: rank ? 4 : 2.5, weight: rank ? 1.5 : 1, color: '#1f2937',
        fillColor: rank === 2 ? '#c8102e' : rank === 1 ? '#ffffff' : '#4b5563', fillOpacity: 1, interactive: false,
      }).addTo(rank ? capitalLayer : townLayer);
      L.marker([lat, lng], { interactive: false, keyboard: false, icon: L.divIcon({ className: cls, html: `<span>${esc(name)}</span>`, iconSize: null }) }).addTo(rank ? capitalLayer : townLayer);
    }
    updateLabelZoom();
  }

  // Live coordinate readout.
  function showCoords(latlng) {
    const d = C.describe(latlng.lat, latlng.lng);
    const [utmK, utmV] = d.utm.split(': ');
    const [ntmK, ntmV] = d.ntm.split(': ');
    $('#hud-dd').textContent = d.dd;
    $('#hud-dms').textContent = d.dms;
    $('#hud-utm-k').textContent = utmK.replace('UTM Zone ', 'UTM ');
    $('#hud-utm').textContent = utmV;
    $('#hud-ntm-k').textContent = ntmK.replace(' Belt', '');
    $('#hud-ntm').textContent = ntmV;
  }
  map.on('mousemove', (e) => showCoords(e.latlng));
  // Touch screens have no mouse pointer: show the coordinates of the map centre
  // under a crosshair instead, so you can read off any spot by panning to it.
  if (window.matchMedia('(hover: none)').matches) {
    const cross = L.DomUtil.create('div', 'centre-cross', $('.map-wrap'));
    cross.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><circle cx="12" cy="12" r="1.5"/></svg>';
    map.on('move', () => showCoords(map.getCenter()));
    map.whenReady(() => showCoords(map.getCenter()));
  }
  map.on('click', (e) => {
    showCoords(e.latlng);
    if (state.mode === 'pick-site') {
      endMode();
      openSiteForm({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });

  // ---------- modes (pick / draw / measure / edit shape) ----------

  function startMode(mode, message) {
    endMode();
    map.closePopup();
    state.mode = mode;
    $('#mode-text').textContent = message;
    $('#mode-banner').hidden = false;
    $('#mode-save').hidden = mode !== 'edit-shape';
    $('.map-wrap').classList.toggle('picking', mode !== 'edit-shape');
    if (window.matchMedia('(max-width: 760px)').matches) $('#panel').scrollTop = 0;
  }

  function endMode() {
    if (state.drawHandler) { state.drawHandler.disable(); state.drawHandler = null; }
    if (state.editingLayer) {
      state.editingLayer.editing.disable();
      state.editingLayer = null;
      state.editingArea = null;
      renderAreas(); // put the original shape back
    }
    state.mode = null;
    $('#mode-banner').hidden = true;
    $('.map-wrap').classList.remove('picking');
  }

  $('#mode-cancel').addEventListener('click', endMode);

  map.on(L.Draw.Event.CREATED, (e) => {
    const mode = state.mode;
    state.drawHandler = null;
    endMode();
    if (mode === 'draw-area') {
      const latlngs = e.layer.getLatLngs()[0];
      openAreaForm({ geometry: latlngsToGeometry(latlngs) });
    } else if (mode === 'measure') {
      const pts = e.layer.getLatLngs();
      let metres = 0;
      for (let i = 1; i < pts.length; i++) metres += pts[i - 1].distanceTo(pts[i]);
      tempLayer.clearLayers();
      const line = L.polyline(pts, { color: DRAW_COLOUR, weight: 3, dashArray: '4 6' }).addTo(tempLayer);
      const dist = metres >= 1000 ? (metres / 1000).toFixed(3) + ' km' : metres.toFixed(1) + ' m';
      line.bindPopup(`<div class="pop-head"><div class="pop-swatch" style="background:${DRAW_COLOUR}"></div><div><div class="pop-sub">Measured distance</div><div class="pop-title">${dist}</div></div></div>
        <div class="pop-actions"><button data-action="clear-measure">Clear</button></div>`).openPopup(pts[pts.length - 1]);
    }
  });

  const DRAW_COLOUR = '#c8102e';
  const drawShapeOptions = { color: DRAW_COLOUR, weight: 2.5, fillOpacity: 0.12 };

  $('#btn-add-click').addEventListener('click', () => startMode('pick-site', 'Click the map where the site is'));

  $('#btn-add-coords').addEventListener('click', () => openSiteForm({}));

  $('#btn-add-gps').addEventListener('click', () => {
    if (!navigator.geolocation) return toast('This device has no GPS / location support', true);
    toast('Getting your position…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy, altitude } = pos.coords;
        map.setView([latitude, longitude], Math.max(map.getZoom(), 15));
        openSiteForm({
          lat: latitude, lng: longitude,
          accuracy_m: Math.round(accuracy * 10) / 10,
          elevation_m: altitude != null ? Math.round(altitude * 10) / 10 : '',
          survey_date: new Date().toISOString().slice(0, 10),
        });
      },
      (err) => toast('Could not get location: ' + err.message, true),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  });

  $('#btn-draw-area').addEventListener('click', () => {
    startMode('draw-area', 'Click each corner, then click the first point to finish');
    state.drawHandler = new L.Draw.Polygon(map, { shapeOptions: drawShapeOptions, showArea: true, metric: true, allowIntersection: false });
    state.drawHandler.enable();
  });

  $('#btn-measure').addEventListener('click', () => {
    startMode('measure', 'Click points along the line, click the last point again to finish');
    state.drawHandler = new L.Draw.Polyline(map, { shapeOptions: { color: DRAW_COLOUR, weight: 3 }, metric: true, showLength: true });
    state.drawHandler.enable();
  });

  $('#mode-save').addEventListener('click', async () => {
    if (state.mode !== 'edit-shape' || !state.editingLayer) return;
    const area = state.editingArea;
    const geometry = latlngsToGeometry(state.editingLayer.getLatLngs()[0]);
    try {
      await api('PUT', `/api/areas/${area.id}`, { ...area, geometry });
      state.editingLayer.editing.disable();
      state.editingLayer = null;
      endMode();
      toast('Boundary updated');
      await refresh();
    } catch (err) {
      toast(err.message, true);
    }
  });

  // ---------- coordinate system selects ----------

  function preferredSystem() {
    const saved = storage('coordSystem');
    return saved && C.SYSTEMS[saved] ? saved : 'DD';
  }

  function fillSystemSelect(select) {
    select.innerHTML = Object.entries(C.SYSTEMS).map(([code, s]) => `<option value="${esc(code)}">${esc(s.label)}</option>`).join('');
    select.value = preferredSystem();
  }

  function coordLabels(system) {
    return C.SYSTEMS[system].kind === 'projected' ? ['Easting (m)', 'Northing (m)'] : ['Latitude', 'Longitude'];
  }

  function formatFor(system, lat, lng) {
    if (system === 'DD') return [lat.toFixed(7), lng.toFixed(7)];
    if (system === 'DMS') return [C.toDMS(lat, true), C.toDMS(lng, false)];
    const { easting, northing } = C.fromLatLng(system, lat, lng);
    return [easting.toFixed(2), northing.toFixed(2)];
  }

  // ---------- sites ----------

  function populateSelect(select, items, selected) {
    select.innerHTML = items.map((v) => `<option${v === selected ? ' selected' : ''}>${esc(v)}</option>`).join('');
  }

  const siteDialog = $('#site-dialog');
  const siteForm = $('#site-form');

  function siteFormLatLng() {
    const f = siteForm.elements;
    return C.readInput(f.system.value, f.a.value.trim(), f.b.value.trim());
  }

  function setSiteSystem(system, latlng) {
    const f = siteForm.elements;
    f.system.value = system;
    siteForm.dataset.system = system;
    const [la, lb] = coordLabels(system);
    $('[data-coord-label="a"]', siteForm).textContent = la;
    $('[data-coord-label="b"]', siteForm).textContent = lb;
    if (latlng) [f.a.value, f.b.value] = formatFor(system, latlng.lat, latlng.lng);
  }

  let locateTimer;
  function checkSiteLocation() {
    clearTimeout(locateTimer);
    const out = $('#site-locate');
    let ll;
    try { ll = siteFormLatLng(); } catch (err) { out.innerHTML = ''; return; }
    locateTimer = setTimeout(async () => {
      try {
        const loc = await api('GET', `/api/locate?lat=${ll.lat}&lng=${ll.lng}`);
        const d = C.describe(ll.lat, ll.lng);
        if (!loc.accepted) {
          out.innerHTML = `<div class="line bad">✕ Outside Nigeria. This point cannot be saved.</div><div class="coords">${esc(d.dd)}</div>`;
        } else {
          const place = [loc.lga, loc.state].filter(Boolean).join(', ');
          out.innerHTML = `<div class="line ${loc.inNigeria ? 'ok' : 'warn'}">${loc.inNigeria ? '✓' : '⚠ Near the border:'} ${esc(place)}</div><div class="coords">${esc(d.dd)} · ${esc(d.utm)}</div>`;
        }
      } catch { out.textContent = ''; }
    }, 250);
  }

  function openSiteForm(site) {
    const f = siteForm.elements;
    const m = state.meta;
    siteForm.reset();
    $('#site-error').textContent = '';
    $('#site-locate').textContent = '';
    $('#site-form-title').textContent = site.id ? 'Edit site' : 'New site';
    f.id.value = site.id || '';
    f.name.value = site.name || '';
    populateSelect(f.feature_type, m.featureTypes, site.feature_type || 'Mine site');
    populateSelect(f.mineral, m.minerals, site.mineral || storage('lastMineral') || 'Gold');
    populateSelect(f.status, m.statuses, site.status || 'Exploration');
    populateSelect(f.ownership, m.ownership, site.ownership || 'Not yet known');
    f.survey_date.value = site.survey_date || '';
    f.elevation_m.value = site.elevation_m ?? '';
    f.accuracy_m.value = site.accuracy_m ?? '';
    f.surveyor.value = site.surveyor || storage('lastSurveyor') || '';
    f.notes.value = site.notes || '';
    const hasPoint = Number.isFinite(site.lat) && Number.isFinite(site.lng);
    setSiteSystem(preferredSystem(), hasPoint ? { lat: site.lat, lng: site.lng } : null);
    if (!hasPoint) { f.a.value = ''; f.b.value = ''; }
    siteDialog.showModal();
    if (hasPoint) checkSiteLocation();
    (site.name ? f.notes : f.name).focus();
  }

  siteForm.elements.system.addEventListener('change', (e) => {
    const newSystem = e.target.value;
    storage('coordSystem', newSystem);
    // Convert whatever was typed into the newly chosen system.
    let ll = null;
    try { ll = C.readInput(siteForm.dataset.system || 'DD', siteForm.elements.a.value.trim(), siteForm.elements.b.value.trim()); } catch { /* nothing typed yet */ }
    setSiteSystem(newSystem, ll);
  });
  siteForm.elements.a.addEventListener('input', checkSiteLocation);
  siteForm.elements.b.addEventListener('input', checkSiteLocation);

  siteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = siteForm.elements;
    let ll;
    try { ll = siteFormLatLng(); } catch (err) { $('#site-error').textContent = err.message; return; }
    const body = {
      name: f.name.value, lat: ll.lat, lng: ll.lng,
      feature_type: f.feature_type.value, mineral: f.mineral.value, status: f.status.value, ownership: f.ownership.value,
      survey_date: f.survey_date.value, elevation_m: f.elevation_m.value, accuracy_m: f.accuracy_m.value,
      surveyor: f.surveyor.value, notes: f.notes.value,
    };
    try {
      const saved = await api(f.id.value ? 'PUT' : 'POST', f.id.value ? `/api/sites/${f.id.value}` : '/api/sites', body);
      storage('lastMineral', body.mineral);
      if (body.surveyor) storage('lastSurveyor', body.surveyor);
      siteDialog.close();
      toast(`Saved “${saved.name}” — ${[saved.lga, saved.state].filter(Boolean).join(', ')}`);
      await refresh();
      focusSite(saved.id);
    } catch (err) {
      $('#site-error').textContent = err.message;
    }
  });

  function filteredSites() {
    const q = $('#f-q').value.trim().toLowerCase();
    const st = $('#f-state').value;
    const min = $('#f-mineral').value;
    const own = $('#f-ownership').value;
    return state.sites.filter((s) =>
      (!st || s.state === st) && (!min || s.mineral === min) && (!own || ownershipOf(s) === own) &&
      (!q || [s.name, s.lga, s.state, s.surveyor, s.notes].some((v) => v && v.toLowerCase().includes(q))));
  }

  const siteMarkers = new Map();

  function sitePopup(s) {
    const d = C.describe(s.lat, s.lng);
    const rows = [
      ['Type', s.feature_type], ['Mineral', s.mineral], ['Status', s.status], ['Ownership', ownershipOf(s)],
      ['Location', [s.lga, s.state].filter(Boolean).join(', ')],
      ['Lat/Lng', d.dd], ['DMS', d.dms], ['UTM', d.utm.replace(/^UTM Zone /, '')], ['Minna', d.ntm.replace(/^Minna /, '')],
      ['Elevation', s.elevation_m != null ? s.elevation_m + ' m' : ''], ['Accuracy', s.accuracy_m != null ? '±' + s.accuracy_m + ' m' : ''],
      ['Surveyor', s.surveyor], ['Date', s.survey_date], ['Notes', s.notes],
    ].filter(([, v]) => v);
    const mono = new Set(['Lat/Lng', 'DMS', 'UTM', 'Minna']);
    return `<div class="pop-head"><div class="pop-swatch" style="background:${colourFor(s.mineral)}"></div>
        <div><div class="pop-title">${esc(s.name)}</div><div class="pop-sub">${esc(s.mineral)} · ${esc(s.feature_type)}</div></div></div>
      <dl class="pop-grid">${rows.slice(1).filter(([k]) => k !== 'Mineral').map(([k, v]) => `<dt>${esc(k)}</dt><dd${mono.has(k) ? ' class="mono"' : ''}>${esc(v)}</dd>`).join('')}</dl>
      <div class="pop-actions">
        <button class="primary" data-action="edit-site" data-id="${s.id}">Edit</button>
        <button data-action="copy" data-text="${esc(d.dd)}">Copy lat/lng</button>
        <a href="https://www.google.com/maps/dir/?api=1&amp;destination=${s.lat},${s.lng}" target="_blank" rel="noopener">Directions</a>
        <button class="danger" data-action="delete-site" data-id="${s.id}">Delete</button>
      </div>`;
  }

  function renderSites() {
    const sites = filteredSites();
    sitesLayer.clearLayers();
    siteMarkers.clear();
    for (const s of sites) {
      const marker = L.circleMarker([s.lat, s.lng], {
        radius: 8, weight: 3.5, color: ownColour(s), fillColor: colourFor(s.mineral), fillOpacity: 1,
      }).bindPopup(() => sitePopup(s), { maxWidth: 340 }).bindTooltip(s.name, { direction: 'top', offset: [0, -6] });
      marker.addTo(sitesLayer);
      siteMarkers.set(s.id, marker);
    }
    $('#sites-count').textContent = state.sites.length ? `Showing ${sites.length} of ${state.sites.length} sites` : '';
    $('#sites-list').innerHTML = sites.length ? sites.map((s) => `
      <li class="item" data-site="${s.id}">
        <span class="bar" style="background:${colourFor(s.mineral)}"></span>
        <div>
          <div class="title">${esc(s.name)}</div>
          <div class="meta"><span class="chip"><i style="background:${colourFor(s.mineral)}"></i>${esc(s.mineral)}</span><span class="chip">${esc(s.feature_type)}</span><span class="chip status-${esc(s.status)}">${esc(s.status)}</span>${ownChip(s)}</div>
          <div class="where"><svg class="icon"><use href="#i-pin"/></svg>${esc([s.lga, s.state].filter(Boolean).join(', '))}</div>
        </div>
      </li>`).join('') : state.sites.length
      ? '<li class="empty"><svg class="icon"><use href="#i-search"/></svg><b>No matching sites</b><span>Try a different search or filter.</span></li>'
      : '<li class="empty"><svg class="icon"><use href="#i-pin"/></svg><b>No sites yet</b><span>Pick a point on the map, type coordinates, or capture your GPS position.</span></li>';

    const used = [...new Set(state.sites.map((s) => s.mineral))];
    const owners = state.meta.ownership.filter((o) => [...state.sites, ...state.areas].some((x) => ownershipOf(x) === o));
    $('.legend').innerHTML = used.length || owners.length
      ? (owners.length ? '<h4>Ownership (pin edge)</h4>' + owners.map((o) => `<div><i class="ring" style="border-color:${OWNERSHIP_COLOURS[o]}"></i>${esc(o)}</div>`).join('') : '')
        + (used.length ? '<h4>Mineral (pin fill)</h4>' + used.map((m) => `<div><i style="background:${colourFor(m)}"></i>${esc(m)}</div>`).join('') : '')
      : '';
    $('.legend').style.display = used.length ? '' : 'none';
  }

  function focusSite(id) {
    const marker = siteMarkers.get(Number(id));
    if (!marker) return;
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 14));
    marker.openPopup();
  }

  $('#sites-list').addEventListener('click', (e) => {
    const li = e.target.closest('[data-site]');
    if (li) focusSite(li.dataset.site);
  });
  ['#f-q', '#f-state', '#f-mineral', '#f-ownership'].forEach((sel) => $(sel).addEventListener('input', renderSites));

  // ---------- areas ----------

  const areaDialog = $('#area-dialog');
  const areaForm = $('#area-form');
  const areaShapes = new Map();

  async function openAreaForm(area) {
    const f = areaForm.elements;
    const m = state.meta;
    areaForm.reset();
    $('#area-error').textContent = '';
    $('#area-form-title').textContent = area.id ? 'Edit area' : 'New licence / field area';
    f.id.value = area.id || '';
    f.geometry.value = JSON.stringify(area.geometry);
    f.name.value = area.name || '';
    populateSelect(f.licence_type, m.licenceTypes, area.licence_type || m.licenceTypes[1]);
    populateSelect(f.mineral, m.minerals, area.mineral || storage('lastMineral') || 'Gold');
    populateSelect(f.ownership, m.ownership, area.ownership || 'Not yet known');
    f.licence_no.value = area.licence_no || '';
    f.holder.value = area.holder || '';
    f.notes.value = area.notes || '';

    const latlngs = geometryToLatLngs(area.geometry)[0];
    const ha = C.areaHa(latlngs);
    const per = perimeterM(latlngs);
    const centre = L.polygon(latlngs).getBounds().getCenter();
    $('#area-summary').innerHTML = `
      <div class="kpi"><b>${esc(ha >= 100 ? ha.toLocaleString('en-NG', { maximumFractionDigits: 1 }) : ha.toFixed(3))}</b><span>hectares</span></div>
      <div class="kpi"><b>${esc((per / 1000).toFixed(3))}</b><span>km perimeter</span></div>
      <div class="kpi"><b>${latlngs.length}</b><span>corners</span></div>`;
    areaDialog.showModal();
    f.name.focus();
    try {
      const loc = await api('GET', `/api/locate?lat=${centre.lat}&lng=${centre.lng}`);
      if (loc.accepted) $('#area-summary').insertAdjacentHTML('beforeend', `<div class="place">✓ ${esc([loc.lga, loc.state].filter(Boolean).join(', '))}</div>`);
    } catch { /* ignore */ }
  }

  areaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = areaForm.elements;
    const body = {
      name: f.name.value, licence_type: f.licence_type.value, licence_no: f.licence_no.value,
      holder: f.holder.value, ownership: f.ownership.value, mineral: f.mineral.value, notes: f.notes.value, geometry: JSON.parse(f.geometry.value),
    };
    try {
      const saved = await api(f.id.value ? 'PUT' : 'POST', f.id.value ? `/api/areas/${f.id.value}` : '/api/areas', body);
      areaDialog.close();
      tempLayer.clearLayers();
      toast(`Saved “${saved.name}” — ${fmtHa(saved.area_ha)}`);
      await refresh();
      focusArea(saved.id);
    } catch (err) {
      $('#area-error').textContent = err.message;
    }
  });

  function areaPopup(a) {
    const rows = [
      ['Title', a.licence_type], ['Number', a.licence_no], ['Holder', a.holder], ['Ownership', ownershipOf(a)], ['Mineral', a.mineral],
      ['Area', fmtHa(a.area_ha)], ['Location', [a.lga, a.state].filter(Boolean).join(', ')], ['Notes', a.notes],
    ].filter(([, v]) => v);
    return `<div class="pop-head"><div class="pop-swatch" style="background:${colourFor(a.mineral)}"></div>
        <div><div class="pop-title">${esc(a.name)}</div><div class="pop-sub">${esc(fmtHa(a.area_ha))}</div></div></div>
      <dl class="pop-grid">${rows.filter(([k]) => k !== 'Area').map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      <div class="pop-actions">
        <button class="primary" data-action="edit-area" data-id="${a.id}">Edit details</button>
        <button data-action="edit-shape" data-id="${a.id}">Edit shape</button>
        <button data-action="corners" data-id="${a.id}">Corners CSV</button>
        <button class="danger" data-action="delete-area" data-id="${a.id}">Delete</button>
      </div>`;
  }

  function renderAreas() {
    areasLayer.clearLayers();
    areaShapes.clear();
    for (const a of state.areas) {
      const colour = colourFor(a.mineral);
      const shape = L.polygon(geometryToLatLngs(a.geometry), { color: ownColour(a), weight: 3, fillColor: colour, fillOpacity: 0.22 })
        .bindPopup(() => areaPopup(a), { maxWidth: 340 })
        .bindTooltip(`${a.name} (${a.area_ha.toFixed(1)} ha)`, { sticky: true });
      shape.addTo(areasLayer);
      areaShapes.set(a.id, shape);
    }
    const total = state.areas.reduce((s, a) => s + a.area_ha, 0);
    $('#areas-count').textContent = state.areas.length ? `${state.areas.length} ${state.areas.length === 1 ? 'area' : 'areas'} · ${fmtHa(total)} in total` : '';
    $('#areas-list').innerHTML = state.areas.length ? state.areas.map((a) => `
      <li class="item" data-area="${a.id}">
        <span class="bar" style="background:${colourFor(a.mineral)}"></span>
        <div>
          <div class="title">${esc(a.name)}</div>
          <div class="meta"><span class="chip"><i style="background:${colourFor(a.mineral)}"></i>${esc(a.mineral)}</span><span class="chip">${esc(a.licence_type.replace(/^.*\((\w+)\)$/, '$1'))}${a.licence_no ? ' ' + esc(a.licence_no) : ''}</span><span class="chip">${esc(fmtHa(a.area_ha))}</span>${ownChip(a)}</div>
          <div class="where"><svg class="icon"><use href="#i-pin"/></svg>${esc([a.lga, a.state].filter(Boolean).join(', '))}</div>
        </div>
      </li>`).join('') : '<li class="empty"><svg class="icon"><use href="#i-poly"/></svg><b>No licence areas yet</b><span>Draw a boundary on the map or paste beacon coordinates from a survey plan.</span></li>';
  }

  function focusArea(id) {
    const shape = areaShapes.get(Number(id));
    if (!shape) return;
    map.fitBounds(shape.getBounds(), { maxZoom: 16, padding: [30, 30] });
    shape.openPopup();
  }

  $('#areas-list').addEventListener('click', (e) => {
    const li = e.target.closest('[data-area]');
    if (li) focusArea(li.dataset.area);
  });

  // Beacon (corner) coordinate entry
  const beaconDialog = $('#beacon-dialog');
  const beaconForm = $('#beacon-form');
  $('#btn-beacons').addEventListener('click', () => {
    $('#beacon-error').textContent = '';
    beaconForm.elements.system.value = preferredSystem();
    beaconDialog.showModal();
  });
  beaconForm.elements.system.addEventListener('change', (e) => storage('coordSystem', e.target.value));
  beaconForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = beaconForm.elements;
    let points;
    try {
      points = C.parseBeacons(f.system.value, f.beacons.value);
    } catch (err) { $('#beacon-error').textContent = err.message; return; }
    // Drop a repeated closing point if the user typed one.
    if (points.length > 1) {
      const a = points[0], b = points[points.length - 1];
      if (Math.abs(a.lat - b.lat) < 1e-9 && Math.abs(a.lng - b.lng) < 1e-9) points.pop();
    }
    if (points.length < 3) { $('#beacon-error').textContent = 'Enter at least 3 corners'; return; }
    beaconDialog.close();
    const latlngs = points.map((p) => L.latLng(p.lat, p.lng));
    tempLayer.clearLayers();
    const preview = L.polygon(latlngs, drawShapeOptions).addTo(tempLayer);
    latlngs.forEach((p, i) => L.circleMarker(p, { radius: 4, color: DRAW_COLOUR }).bindTooltip(`Corner ${i + 1}`).addTo(tempLayer));
    map.fitBounds(preview.getBounds(), { maxZoom: 16, padding: [30, 30] });
    openAreaForm({ geometry: latlngsToGeometry(latlngs) });
  });

  function cornersCsv(area) {
    const latlngs = geometryToLatLngs(area.geometry)[0];
    const utm = C.utmZoneFor(latlngs[0].lng);
    const belt = C.ntmBeltFor(latlngs[0].lng);
    const header = ['corner', 'latitude', 'longitude', `${utm}_easting`, `${utm}_northing`, `${belt}_easting`, `${belt}_northing`];
    const lines = latlngs.map((p, i) => {
      const u = C.fromLatLng(utm, p.lat, p.lng);
      const b = C.fromLatLng(belt, p.lat, p.lng);
      return [`C${i + 1}`, p.lat.toFixed(7), p.lng.toFixed(7), u.easting.toFixed(2), u.northing.toFixed(2), b.easting.toFixed(2), b.northing.toFixed(2)].join(',');
    });
    return [header.join(','), ...lines].join('\r\n') + '\r\n';
  }

  // ---------- popup buttons (event delegation) ----------

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    try {
      if (action === 'edit-site') {
        map.closePopup();
        openSiteForm(state.sites.find((s) => s.id === id));
      } else if (action === 'delete-site') {
        const s = state.sites.find((x) => x.id === id);
        if (!(await askConfirm('Delete this site?', `“${s.name}” will be removed. This cannot be undone.`))) return;
        await api('DELETE', `/api/sites/${id}`);
        map.closePopup();
        toast('Site deleted');
        await refresh();
      } else if (action === 'copy') {
        try {
          await navigator.clipboard.writeText(btn.dataset.text);
          toast('Copied ' + btn.dataset.text);
        } catch {
          toast('Copying is blocked here. Coordinates: ' + btn.dataset.text, true);
        }
      } else if (action === 'edit-area') {
        map.closePopup();
        openAreaForm(state.areas.find((a) => a.id === id));
      } else if (action === 'edit-shape') {
        map.closePopup();
        const area = state.areas.find((a) => a.id === id);
        startMode('edit-shape', 'Drag the corners, then press Save shape');
        state.editingArea = area;
        state.editingLayer = areaShapes.get(id);
        state.editingLayer.editing.enable();
        map.fitBounds(state.editingLayer.getBounds(), { maxZoom: 17, padding: [30, 30] });
      } else if (action === 'corners') {
        const area = state.areas.find((a) => a.id === id);
        download(`${area.name.replace(/[^\w-]+/g, '_')}_corners.csv`, cornersCsv(area), 'text/csv');
      } else if (action === 'delete-area') {
        const a = state.areas.find((x) => x.id === id);
        if (!(await askConfirm('Delete this area?', `“${a.name}” will be removed. This cannot be undone.`))) return;
        await api('DELETE', `/api/areas/${id}`);
        map.closePopup();
        toast('Area deleted');
        await refresh();
      } else if (action === 'clear-measure') {
        tempLayer.clearLayers();
      } else if (action === 'add-here') {
        map.closePopup();
        openSiteForm({ lat: Number(btn.dataset.lat), lng: Number(btn.dataset.lng) });
      }
    } catch (err) {
      toast(err.message, true);
    }
  });

  // dialogs: any [data-close] button closes its dialog
  $$('dialog [data-close]').forEach((b) => b.addEventListener('click', () => {
    b.closest('dialog').close();
  }));
  areaDialog.addEventListener('close', () => { if (!areaForm.elements.id.value) tempLayer.clearLayers(); });

  // ---------- converter tab ----------

  const cvSystem = $('#cv-system');
  function updateConverterLabels() {
    const [a, b] = coordLabels(cvSystem.value);
    $('#cv-a-label').textContent = a;
    $('#cv-b-label').textContent = b;
  }
  cvSystem.addEventListener('change', updateConverterLabels);

  $('#cv-go').addEventListener('click', async () => {
    const out = $('#cv-result');
    try {
      const ll = C.readInput(cvSystem.value, $('#cv-a').value.trim(), $('#cv-b').value.trim());
      state.lastConverted = ll;
      const rows = Object.entries(C.SYSTEMS).map(([code, s]) => {
        const [a, b] = formatFor(code, ll.lat, ll.lng);
        return `<tr><td>${esc(s.label)}</td><td>${esc(a)}<br>${esc(b)}</td></tr>`;
      }).join('');
      const loc = await api('GET', `/api/locate?lat=${ll.lat}&lng=${ll.lng}`);
      const where = loc.accepted
        ? `<div class="status-line ${loc.inNigeria ? 'ok' : 'warn'}">${loc.inNigeria ? '✓ In Nigeria' : '⚠ Near the border'}: ${esc([loc.lga, loc.state].filter(Boolean).join(', '))}</div>`
        : '<div class="status-line bad">✕ This point is outside Nigeria</div>';
      out.innerHTML = where + `<table>${rows}</table>`;
      $('#cv-show').disabled = false;
    } catch (err) {
      out.innerHTML = `<div class="status-line bad">${esc(err.message)}</div>`;
      $('#cv-show').disabled = true;
    }
  });

  $('#cv-show').addEventListener('click', () => {
    const ll = state.lastConverted;
    if (!ll) return;
    tempLayer.clearLayers();
    showTempPoint(ll, 'Converted point');
  });

  // ---------- data tab: stats, CSV import, editor key ----------

  async function renderStats() {
    const s = await api('GET', '/api/stats');
    const ha = Math.round(s.totalAreaHa).toLocaleString('en-NG');
    $('#topbar-stats').innerHTML = `<span class="kpi-chip"><b>${s.sites}</b> ${s.sites === 1 ? 'site' : 'sites'}</span><span class="kpi-chip"><b>${s.areas}</b> ${s.areas === 1 ? 'area' : 'areas'}</span><span class="kpi-chip"><b>${ha}</b> ha</span>`;
    const max = Math.max(1, ...s.byMineral.map((r) => r.count));
    const maxS = Math.max(1, ...s.byState.map((r) => r.count));
    const bars = (rows, key, top, colour) => rows.slice(0, 10).map((r) => `<div class="bar-row"><span>${esc(r[key] || 'Unknown')}</span><span class="track"><span class="fill" style="width:${(r.count / top) * 100}%;${colour ? 'background:' + colour(r[key]) : ''}"></span></span><span>${r.count}</span></div>`).join('');
    $('#stats').innerHTML = `
      <div class="kpi"><b>${s.sites}</b><span>${s.sites === 1 ? 'site' : 'sites'}</span></div>
      <div class="kpi"><b>${s.areas}</b><span>${s.areas === 1 ? 'area' : 'areas'}</span></div>
      <div class="kpi"><b>${ha}</b><span>hectares</span></div>
      ${s.byMineral.length ? `<div class="bars"><h4>Sites by mineral</h4>${bars(s.byMineral, 'mineral', max, colourFor)}</div>` : ''}
      ${s.byOwnership && s.byOwnership.length ? `<div class="bars"><h4>Sites by ownership</h4>${bars(s.byOwnership, 'ownership', Math.max(1, ...s.byOwnership.map((r) => r.count)), (o) => OWNERSHIP_COLOURS[o] || OWNERSHIP_COLOURS['Not yet known'])}</div>` : ''}
      ${s.byState.length ? `<div class="bars"><h4>Sites by state</h4>${bars(s.byState, 'state', maxS)}</div>` : ''}`;
  }

  // Minimal CSV parser that understands quoted fields.
  function parseCsv(textIn) {
    const rows = [];
    let row = [], field = '', quoted = false;
    const t = textIn.replace(/^﻿/, '');
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (quoted) {
        if (c === '"' && t[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') quoted = false;
        else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && t[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = '';
      } else field += c;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.some((v) => v.trim() !== ''));
  }

  const HEADER_ALIASES = { owner: 'ownership', land_ownership: 'ownership', latitude: 'lat', y: 'lat', longitude: 'lng', lon: 'lng', long: 'lng', x: 'lng', type: 'feature_type', elevation: 'elevation_m', accuracy: 'accuracy_m', date: 'survey_date' };

  $('#csv-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const out = $('#import-result');
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error('The file has no data rows');
      const header = rows[0].map((h) => { const k = h.trim().toLowerCase().replace(/\s+/g, '_'); return HEADER_ALIASES[k] || k; });
      if (!header.includes('lat') || !header.includes('lng') || !header.includes('name')) throw new Error('Need name, lat and lng columns');
      const sites = rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
      const result = await api('POST', '/api/sites/bulk', { sites });
      out.innerHTML = `<div class="status-line ok">✓ Imported ${result.created} site(s)</div>` +
        (result.errors.length ? `<div class="status-line warn">${result.errors.length} row(s) skipped</div><ul class="small">${result.errors.slice(0, 20).map((er) => `<li>Row ${er.row + 1}: ${esc(er.error)}</li>`).join('')}</ul>` : '');
      await refresh();
    } catch (err) {
      out.innerHTML = `<div class="status-line bad">${esc(err.message)}</div>`;
    } finally {
      e.target.value = '';
    }
  });

  $('#editor-key').value = storage('editorKey') || '';
  $('#save-key').addEventListener('click', () => {
    const v = $('#editor-key').value.trim();
    storage('editorKey', v || null);
    toast(v ? 'Editor key saved in this browser' : 'Editor key removed');
  });

  // ---------- tabs & panel ----------

  function setPanelHidden(hidden) {
    $('#panel').classList.toggle('hidden', hidden);
    $('#toggle-panel').setAttribute('aria-expanded', String(!hidden));
    setTimeout(() => map.invalidateSize(), 60);
  }

  $$('.tab').forEach((tab) => tab.addEventListener('click', () => {
    // Tapping the section you are already on hides / shows the panel.
    if (tab.classList.contains('active')) return setPanelHidden(!$('#panel').classList.contains('hidden'));
    setPanelHidden(false);
    $$('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + tab.dataset.tab));
    if (tab.dataset.tab === 'data') renderStats().catch(() => {});
  }));

  $('#toggle-panel').addEventListener('click', () => setPanelHidden(!$('#panel').classList.contains('hidden')));

  // ---------- theme ----------

  function applyThemeIcon() {
    $('#btn-theme use').setAttribute('href', isDarkTheme() ? '#i-sun' : '#i-moon');
  }
  $('#btn-theme').addEventListener('click', () => {
    const next = isDarkTheme() ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    storage('theme', next);
    applyThemeIcon();
    // Follow the theme with the matching clean basemap, unless the user picked imagery etc.
    const want = next === 'dark' ? 'Dark' : 'Light';
    const other = next === 'dark' ? 'Light' : 'Dark';
    if (map.hasLayer(baseLayers[other])) { map.removeLayer(baseLayers[other]); baseLayers[want].addTo(map); storage('baseLayer', want); }
  });
  applyThemeIcon();

  // ---------- go to coordinate ----------

  function showTempPoint(ll, label) {
    tempLayer.clearLayers();
    const icon = L.divIcon({ className: '', html: '<div class="goto-pin"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
    const d = C.describe(ll.lat, ll.lng);
    L.marker([ll.lat, ll.lng], { icon }).addTo(tempLayer)
      .bindPopup(`<div class="pop-head"><div class="pop-swatch" style="background:${DRAW_COLOUR}"></div><div><div class="pop-title">${esc(label)}</div><div class="pop-sub mono">${esc(d.dd)}</div></div></div>
        <dl class="pop-grid"><dt>DMS</dt><dd class="mono">${esc(d.dms)}</dd><dt>UTM</dt><dd class="mono">${esc(d.utm.replace(/^UTM Zone /, ''))}</dd><dt>Minna</dt><dd class="mono">${esc(d.ntm.replace(/^Minna /, ''))}</dd></dl>
        <div class="pop-actions"><button class="primary" data-action="add-here" data-lat="${ll.lat}" data-lng="${ll.lng}">Add site here</button><button data-action="clear-measure">Clear</button></div>`)
      .openPopup();
    map.setView([ll.lat, ll.lng], Math.max(map.getZoom(), 14));
    showCoords(L.latLng(ll.lat, ll.lng));
  }

  // Accepts "9.0579, 7.4951", "9.0579 7.4951" or DMS like 9°03'28"N 7°29'42"E.
  function parseGoto(text) {
    const t = text.trim();
    const dms = t.match(/^(.+?[NS])\s*,?\s*(.+?[EW])$/i);
    if (dms) return C.readInput('DMS', dms[1], dms[2]);
    const nums = t.match(/-?\d+(?:\.\d+)?/g);
    if (nums && nums.length === 2) return C.readInput('DD', nums[0], nums[1]);
    throw new Error('Type latitude, longitude, e.g. 9.0579, 7.4951');
  }

  $('#goto-form').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      showTempPoint(parseGoto($('#goto-input').value), 'Search result');
    } catch (err) {
      toast(err.message, true);
    }
  });

  // ---------- install as an app (PWA) ----------

  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    $('#btn-install').hidden = false;
  });
  $('#btn-install').addEventListener('click', async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    $('#btn-install').hidden = true;
  });
  window.addEventListener('appinstalled', () => toast('CardinalGIS installed'));
  if (!window.CARDINAL_DATA && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // ---------- load ----------

  async function refresh() {
    const [sites, areas] = await Promise.all([api('GET', '/api/sites'), api('GET', '/api/areas')]);
    state.sites = sites;
    state.areas = areas;
    renderSites();
    renderAreas();
    renderStats().catch(() => {});
  }

  async function init() {
    state.meta = await api('GET', '/api/meta');
    $('#f-state').innerHTML += state.meta.states.map((s) => `<option>${esc(s.name)}</option>`).join('');
    $('#f-mineral').innerHTML += state.meta.minerals.map((m) => `<option>${esc(m)}</option>`).join('');
    $('#f-ownership').innerHTML += state.meta.ownership.map((o) => `<option>${esc(o)}</option>`).join('');
    addStateLabels(state.meta.states);
    $$('.system-select').forEach(fillSystemSelect);
    setSiteSystem(siteForm.elements.system.value, null);
    updateConverterLabels();
    if (state.meta.editorRequired) $('#editor-hint').textContent = 'This server requires an editor key to add or change data. Ask your administrator for it. It is stored only in this browser.';
    await Promise.all([drawBoundary(), drawReferenceMap(), refresh()]);
  }

  init().catch((err) => toast('Could not load data: ' + err.message, true));
})();
