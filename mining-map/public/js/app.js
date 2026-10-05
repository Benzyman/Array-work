// Nigeria Mining Map – browser app.
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

  function download(filename, content, type) {
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

  const baseLayers = {
    'Streets': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap contributors',
    }),
    'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
    }),
    'Terrain': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17, attribution: '&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap (CC-BY-SA)',
    }),
  };
  baseLayers[storage('baseLayer') in baseLayers ? storage('baseLayer') : 'Streets'].addTo(map);
  map.on('baselayerchange', (e) => storage('baseLayer', e.name));

  const sitesLayer = L.featureGroup().addTo(map);
  const areasLayer = L.featureGroup().addTo(map);
  const tempLayer = L.featureGroup().addTo(map);
  L.control.layers(baseLayers, { 'Sites': sitesLayer, 'Licence areas': areasLayer }, { position: 'topright' }).addTo(map);
  L.control.scale({ imperial: false }).addTo(map);

  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = () => L.DomUtil.create('div', 'legend');
  legend.addTo(map);

  // Grey out everything outside Nigeria so it is obvious where data can go.
  async function drawBoundary() {
    const geojson = await api('GET', '/api/boundary');
    const ring = geojson.features[0].geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
    const world = [[-89, -179], [-89, 179], [89, 179], [89, -179]];
    L.polygon([world, ring], { stroke: false, fillColor: '#222', fillOpacity: 0.35, interactive: false }).addTo(map);
    L.polygon(ring, { color: '#0b7a3e', weight: 2, fill: false, interactive: false, dashArray: '6 4' }).addTo(map);
  }

  // Live coordinate readout.
  function showCoords(latlng) {
    const d = C.describe(latlng.lat, latlng.lng);
    $('#coord-bar').innerHTML = `${esc(d.dd)} &nbsp;|&nbsp; ${esc(d.dms)}<br>${esc(d.utm)} &nbsp;|&nbsp; ${esc(d.ntm)}`;
  }
  map.on('mousemove', (e) => showCoords(e.latlng));
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
      const line = L.polyline(pts, { color: '#e0559b', weight: 3, dashArray: '4 6' }).addTo(tempLayer);
      line.bindPopup(`<b>Distance:</b> ${metres >= 1000 ? (metres / 1000).toFixed(3) + ' km' : metres.toFixed(1) + ' m'}<br><button class="btn small" data-action="clear-measure">Clear</button>`).openPopup(pts[pts.length - 1]);
    }
  });

  const drawShapeOptions = { color: '#e0559b', weight: 2, fillOpacity: 0.15 };

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
    state.drawHandler = new L.Draw.Polyline(map, { shapeOptions: { color: '#e0559b', weight: 3 }, metric: true, showLength: true });
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
          out.innerHTML = `<span class="error">✖ ${esc(d.dd)} is outside Nigeria — it cannot be saved.</span>`;
        } else {
          const place = [loc.lga, loc.state].filter(Boolean).join(', ');
          out.innerHTML = `<span class="${loc.inNigeria ? 'ok' : 'warn'}">${loc.inNigeria ? '✔' : '⚠ Near the border —'} ${esc(place)}</span><br><span class="muted">${esc(d.dd)} · ${esc(d.utm)}</span>`;
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
      feature_type: f.feature_type.value, mineral: f.mineral.value, status: f.status.value,
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
    return state.sites.filter((s) =>
      (!st || s.state === st) && (!min || s.mineral === min) &&
      (!q || [s.name, s.lga, s.state, s.surveyor, s.notes].some((v) => v && v.toLowerCase().includes(q))));
  }

  const siteMarkers = new Map();

  function sitePopup(s) {
    const d = C.describe(s.lat, s.lng);
    const rows = [
      ['Type', s.feature_type], ['Mineral', s.mineral], ['Status', s.status],
      ['Location', [s.lga, s.state].filter(Boolean).join(', ')],
      ['Lat/Lng', d.dd], ['DMS', d.dms], ['UTM', d.utm.replace(/^UTM Zone /, '')], ['Minna', d.ntm.replace(/^Minna /, '')],
      ['Elevation', s.elevation_m != null ? s.elevation_m + ' m' : ''], ['Accuracy', s.accuracy_m != null ? '±' + s.accuracy_m + ' m' : ''],
      ['Surveyor', s.surveyor], ['Date', s.survey_date], ['Notes', s.notes],
    ].filter(([, v]) => v);
    return `<h3>${esc(s.name)}</h3><table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
      <div class="popup-actions">
        <button data-action="edit-site" data-id="${s.id}">Edit</button>
        <button data-action="copy" data-text="${esc(d.dd)}">Copy lat/lng</button>
        <button data-action="directions" data-lat="${s.lat}" data-lng="${s.lng}">Directions</button>
        <button data-action="delete-site" data-id="${s.id}">Delete</button>
      </div>`;
  }

  function renderSites() {
    const sites = filteredSites();
    sitesLayer.clearLayers();
    siteMarkers.clear();
    for (const s of sites) {
      const marker = L.circleMarker([s.lat, s.lng], {
        radius: 7, weight: 1.5, color: '#fff', fillColor: colourFor(s.mineral), fillOpacity: 0.95,
      }).bindPopup(() => sitePopup(s), { maxWidth: 320 }).bindTooltip(s.name, { direction: 'top', offset: [0, -6] });
      marker.addTo(sitesLayer);
      siteMarkers.set(s.id, marker);
    }
    $('#sites-count').textContent = `${sites.length} of ${state.sites.length} sites shown`;
    $('#sites-list').innerHTML = sites.length ? sites.map((s) => `
      <li data-site="${s.id}">
        <span class="dot" style="background:${colourFor(s.mineral)}"></span>
        <div><div class="title">${esc(s.name)}</div>
        <div class="sub">${esc(s.mineral)} · ${esc(s.feature_type)} · ${esc(s.status)}</div>
        <div class="sub">${esc([s.lga, s.state].filter(Boolean).join(', '))}</div></div>
      </li>`).join('') : '<li class="empty">No sites yet. Click “＋ Click map to add”.</li>';

    const used = [...new Set(state.sites.map((s) => s.mineral))];
    $('.legend').innerHTML = used.length ? used.map((m) => `<div><i style="background:${colourFor(m)}"></i>${esc(m)}</div>`).join('') : '';
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
  ['#f-q', '#f-state', '#f-mineral'].forEach((sel) => $(sel).addEventListener('input', renderSites));

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
    f.licence_no.value = area.licence_no || '';
    f.holder.value = area.holder || '';
    f.notes.value = area.notes || '';

    const latlngs = geometryToLatLngs(area.geometry)[0];
    const ha = C.areaHa(latlngs);
    const per = perimeterM(latlngs);
    const centre = L.polygon(latlngs).getBounds().getCenter();
    $('#area-summary').innerHTML = `<b>${esc(fmtHa(ha))}</b> · perimeter ${esc((per / 1000).toFixed(3))} km · ${latlngs.length} corners`;
    areaDialog.showModal();
    f.name.focus();
    try {
      const loc = await api('GET', `/api/locate?lat=${centre.lat}&lng=${centre.lng}`);
      if (loc.accepted) $('#area-summary').innerHTML += `<br><span class="ok">✔ ${esc([loc.lga, loc.state].filter(Boolean).join(', '))}</span>`;
    } catch { /* ignore */ }
  }

  areaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = areaForm.elements;
    const body = {
      name: f.name.value, licence_type: f.licence_type.value, licence_no: f.licence_no.value,
      holder: f.holder.value, mineral: f.mineral.value, notes: f.notes.value, geometry: JSON.parse(f.geometry.value),
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
      ['Title', a.licence_type], ['Number', a.licence_no], ['Holder', a.holder], ['Mineral', a.mineral],
      ['Area', fmtHa(a.area_ha)], ['Location', [a.lga, a.state].filter(Boolean).join(', ')], ['Notes', a.notes],
    ].filter(([, v]) => v);
    return `<h3>${esc(a.name)}</h3><table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
      <div class="popup-actions">
        <button data-action="edit-area" data-id="${a.id}">Edit details</button>
        <button data-action="edit-shape" data-id="${a.id}">Edit shape</button>
        <button data-action="corners" data-id="${a.id}">Corner list (CSV)</button>
        <button data-action="delete-area" data-id="${a.id}">Delete</button>
      </div>`;
  }

  function renderAreas() {
    areasLayer.clearLayers();
    areaShapes.clear();
    for (const a of state.areas) {
      const colour = colourFor(a.mineral);
      const shape = L.polygon(geometryToLatLngs(a.geometry), { color: colour === '#f2efe6' ? '#888' : colour, weight: 2, fillOpacity: 0.18 })
        .bindPopup(() => areaPopup(a), { maxWidth: 320 })
        .bindTooltip(`${a.name} (${a.area_ha.toFixed(1)} ha)`, { sticky: true });
      shape.addTo(areasLayer);
      areaShapes.set(a.id, shape);
    }
    const total = state.areas.reduce((s, a) => s + a.area_ha, 0);
    $('#areas-count').textContent = `${state.areas.length} areas · ${fmtHa(total)} total`;
    $('#areas-list').innerHTML = state.areas.length ? state.areas.map((a) => `
      <li data-area="${a.id}">
        <span class="dot" style="background:${colourFor(a.mineral)}; border-radius:2px"></span>
        <div><div class="title">${esc(a.name)}</div>
        <div class="sub">${esc(a.licence_type)}${a.licence_no ? ' · ' + esc(a.licence_no) : ''}</div>
        <div class="sub">${esc(fmtHa(a.area_ha))} · ${esc([a.lga, a.state].filter(Boolean).join(', '))}</div></div>
      </li>`).join('') : '<li class="empty">No areas yet. Draw a boundary or enter beacon coordinates.</li>';
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
    latlngs.forEach((p, i) => L.circleMarker(p, { radius: 4, color: '#e0559b' }).bindTooltip(`Corner ${i + 1}`).addTo(tempLayer));
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
        if (!confirm(`Delete site “${s.name}”? This cannot be undone.`)) return;
        await api('DELETE', `/api/sites/${id}`);
        map.closePopup();
        toast('Site deleted');
        await refresh();
      } else if (action === 'copy') {
        await navigator.clipboard.writeText(btn.dataset.text);
        toast('Copied ' + btn.dataset.text);
      } else if (action === 'directions') {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${btn.dataset.lat},${btn.dataset.lng}`, '_blank', 'noopener');
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
        if (!confirm(`Delete area “${a.name}”? This cannot be undone.`)) return;
        await api('DELETE', `/api/areas/${id}`);
        map.closePopup();
        toast('Area deleted');
        await refresh();
      } else if (action === 'clear-measure') {
        tempLayer.clearLayers();
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
        ? `<p class="${loc.inNigeria ? 'ok' : 'warn'}">${loc.inNigeria ? '✔ In Nigeria' : '⚠ Near the border'} — ${esc([loc.lga, loc.state].filter(Boolean).join(', '))}</p>`
        : '<p class="error">✖ This point is outside Nigeria</p>';
      out.innerHTML = where + `<table>${rows}</table>`;
      $('#cv-show').disabled = false;
    } catch (err) {
      out.innerHTML = `<p class="error">${esc(err.message)}</p>`;
      $('#cv-show').disabled = true;
    }
  });

  $('#cv-show').addEventListener('click', () => {
    const ll = state.lastConverted;
    if (!ll) return;
    tempLayer.clearLayers();
    L.circleMarker([ll.lat, ll.lng], { radius: 9, color: '#e0559b', weight: 3 })
      .bindPopup(`<b>Converted point</b><br>${esc(C.describe(ll.lat, ll.lng).dd)}<div class="popup-actions"><button data-action="clear-measure">Clear</button></div>`)
      .addTo(tempLayer).openPopup();
    map.setView([ll.lat, ll.lng], Math.max(map.getZoom(), 14));
  });

  // ---------- data tab: stats, CSV import, editor key ----------

  async function renderStats() {
    const s = await api('GET', '/api/stats');
    $('#topbar-stats').textContent = `${s.sites} sites · ${s.areas} areas`;
    const max = Math.max(1, ...s.byMineral.map((r) => r.count));
    const maxS = Math.max(1, ...s.byState.map((r) => r.count));
    const bars = (rows, key, top) => rows.map((r) => `<div class="bar"><span>${esc(r[key] || 'Unknown')}</span><i style="width:${(r.count / top) * 100}%"></i><span>${r.count}</span></div>`).join('');
    $('#stats').innerHTML = `
      <div class="stat"><b>${s.sites}</b><span>sites</span></div>
      <div class="stat"><b>${s.areas}</b><span>areas</span></div>
      <div class="stat"><b>${Math.round(s.totalAreaHa).toLocaleString('en-NG')}</b><span>hectares</span></div>
      ${s.byMineral.length ? `<div class="bars"><h2>Sites by mineral</h2>${bars(s.byMineral, 'mineral', max)}</div>` : ''}
      ${s.byState.length ? `<div class="bars"><h2>Sites by state</h2>${bars(s.byState, 'state', maxS)}</div>` : ''}`;
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

  const HEADER_ALIASES = { latitude: 'lat', y: 'lat', longitude: 'lng', lon: 'lng', long: 'lng', x: 'lng', type: 'feature_type', elevation: 'elevation_m', accuracy: 'accuracy_m', date: 'survey_date' };

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
      out.innerHTML = `<p class="ok">Imported ${result.created} site(s).</p>` +
        (result.errors.length ? `<p class="error">${result.errors.length} row(s) skipped:</p><ul class="small">${result.errors.slice(0, 20).map((er) => `<li>Row ${er.row + 1}: ${esc(er.error)}</li>`).join('')}</ul>` : '');
      await refresh();
    } catch (err) {
      out.innerHTML = `<p class="error">${esc(err.message)}</p>`;
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

  $$('.tab').forEach((tab) => tab.addEventListener('click', () => {
    $$('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + tab.dataset.tab));
    if (tab.dataset.tab === 'data') renderStats().catch(() => {});
  }));

  $('#toggle-panel').addEventListener('click', (e) => {
    const hidden = $('#panel').classList.toggle('hidden');
    e.currentTarget.setAttribute('aria-expanded', String(!hidden));
    setTimeout(() => map.invalidateSize(), 50);
  });

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
    $$('.system-select').forEach(fillSystemSelect);
    setSiteSystem(siteForm.elements.system.value, null);
    updateConverterLabels();
    if (state.meta.editorRequired) $('#editor-hint').textContent = 'This server requires an editor key to add or change data. Ask your administrator for it. It is stored only in this browser.';
    await Promise.all([drawBoundary(), refresh()]);
  }

  init().catch((err) => toast('Could not load data: ' + err.message, true));
})();
