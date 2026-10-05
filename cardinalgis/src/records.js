// Record rules shared by the server and the offline demo: validation of
// sites and areas, and the CSV / KML / GeoJSON export formats.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CardinalRecords = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return function createRecords(geo, constants) {
    const { MINERALS, FEATURE_TYPES, STATUSES, LICENCE_TYPES } = constants;

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

    return { ValidationError, parseSite, parseArea, areaRow, sitesToCsv, toKml, toGeoJson, SITE_COLUMNS };
  };
});
