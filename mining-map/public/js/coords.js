// Coordinate systems used in Nigeria, and conversions between them (via proj4).
//
// - WGS84 lat/lng: what GPS and web maps use.
// - UTM zones 31N, 32N, 33N: Nigeria spans these three (WGS84 datum).
// - Minna datum: Nigeria's national datum, used on older survey plans and
//   mining cadastre (MCO) documents, as UTM or the Nigerian Transverse
//   Mercator (NTM) West / Mid / East belts.
(function (global) {
  const MINNA = '+ellps=clrk80 +towgs84=-92,-93,122,0,0,0,0 +units=m +no_defs';

  const SYSTEMS = {
    DD: { label: 'Latitude / Longitude (decimal degrees, WGS84)', kind: 'geographic' },
    DMS: { label: 'Latitude / Longitude (degrees° minutes\' seconds", WGS84)', kind: 'dms' },
    'EPSG:32631': { label: 'UTM Zone 31N – WGS84 (west of 6°E)', kind: 'projected', def: '+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs' },
    'EPSG:32632': { label: 'UTM Zone 32N – WGS84 (6°E – 12°E)', kind: 'projected', def: '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs' },
    'EPSG:32633': { label: 'UTM Zone 33N – WGS84 (east of 12°E)', kind: 'projected', def: '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs' },
    'EPSG:26331': { label: 'Minna / UTM Zone 31N', kind: 'projected', def: '+proj=utm +zone=31 ' + MINNA },
    'EPSG:26332': { label: 'Minna / UTM Zone 32N', kind: 'projected', def: '+proj=utm +zone=32 ' + MINNA },
    'EPSG:26391': { label: 'Minna / Nigeria West Belt (NTM)', kind: 'projected', def: '+proj=tmerc +lat_0=4 +lon_0=4.5 +k=0.99975 +x_0=230738.26 +y_0=0 ' + MINNA },
    'EPSG:26392': { label: 'Minna / Nigeria Mid Belt (NTM)', kind: 'projected', def: '+proj=tmerc +lat_0=4 +lon_0=8.5 +k=0.99975 +x_0=670553.98 +y_0=0 ' + MINNA },
    'EPSG:26393': { label: 'Minna / Nigeria East Belt (NTM)', kind: 'projected', def: '+proj=tmerc +lat_0=4 +lon_0=12.5 +k=0.99975 +x_0=1110369.7 +y_0=0 ' + MINNA },
  };

  const WGS84 = '+proj=longlat +datum=WGS84 +no_defs';

  function proj(code) {
    const sys = SYSTEMS[code];
    if (!sys || sys.kind !== 'projected') throw new Error('Unknown projected system ' + code);
    return global.proj4(WGS84, sys.def);
  }

  // Projected (easting, northing) -> { lat, lng }
  function toLatLng(code, easting, northing) {
    const [lng, lat] = proj(code).inverse([Number(easting), Number(northing)]);
    return { lat, lng };
  }

  // { lat, lng } -> { easting, northing }
  function fromLatLng(code, lat, lng) {
    const [easting, northing] = proj(code).forward([Number(lng), Number(lat)]);
    return { easting, northing };
  }

  // Which UTM zone / NTM belt should normally be used at this longitude.
  function utmZoneFor(lng) {
    return lng < 6 ? 'EPSG:32631' : lng < 12 ? 'EPSG:32632' : 'EPSG:32633';
  }
  function ntmBeltFor(lng) {
    return lng < 6.5 ? 'EPSG:26391' : lng < 10.5 ? 'EPSG:26392' : 'EPSG:26393';
  }

  function toDMS(value, isLat) {
    const hemi = isLat ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
    let abs = Math.abs(value);
    let d = Math.floor(abs);
    let m = Math.floor((abs - d) * 60);
    let s = Math.round(((abs - d) * 60 - m) * 60 * 100) / 100;
    if (s >= 60) { s = 0; m += 1; }
    if (m >= 60) { m = 0; d += 1; }
    return `${d}°${String(m).padStart(2, '0')}'${s.toFixed(2).padStart(5, '0')}"${hemi}`;
  }

  // Accepts things like: 9°4'30.5"N   9 4 30.5 N   N9 4 30.5   -9 4 30.5   9.075
  function parseDMS(input) {
    if (input === undefined || input === null) return NaN;
    const str = String(input).trim().toUpperCase();
    if (!str) return NaN;
    const neg = /[SW]/.test(str) || /^-/.test(str);
    const nums = str.replace(/[NSEW]/g, ' ').match(/\d+(?:\.\d+)?/g);
    if (!nums || nums.length > 3) return NaN;
    const [d, m = 0, s = 0] = nums.map(Number);
    if (m >= 60 || s >= 60) return NaN;
    const value = d + m / 60 + s / 3600;
    return neg ? -value : value;
  }

  function fmt(n, digits) {
    return Number(n).toLocaleString('en-NG', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  // Everything about one point, for display.
  function describe(lat, lng) {
    const utm = utmZoneFor(lng);
    const belt = ntmBeltFor(lng);
    const u = fromLatLng(utm, lat, lng);
    const b = fromLatLng(belt, lat, lng);
    return {
      dd: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      dms: `${toDMS(lat, true)}  ${toDMS(lng, false)}`,
      utm: `${SYSTEMS[utm].label.split(' –')[0]}: ${fmt(u.easting, 2)} E, ${fmt(u.northing, 2)} N`,
      ntm: `${SYSTEMS[belt].label.replace('Minna / Nigeria ', 'Minna ').replace(' (NTM)', '')}: ${fmt(b.easting, 2)} E, ${fmt(b.northing, 2)} N`,
    };
  }

  // Read a coordinate entered in any supported system. Returns { lat, lng } or throws.
  function readInput(system, a, b) {
    let lat, lng;
    if (system === 'DD') {
      lat = Number(a); lng = Number(b);
    } else if (system === 'DMS') {
      lat = parseDMS(a); lng = parseDMS(b);
    } else {
      if (a === '' || b === '' || !Number.isFinite(Number(a)) || !Number.isFinite(Number(b))) throw new Error('Enter easting and northing in metres');
      ({ lat, lng } = toLatLng(system, a, b));
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Could not read that coordinate');
    return { lat, lng };
  }

  // Parse a block of beacon coordinates, one per line. The last two numbers on
  // each line are used, so lines like "PB 1   345678.12  1012345.67" work.
  // For DD the order is "lat lng"; for projected systems "easting northing".
  function parseBeacons(system, textBlock) {
    const points = [];
    const lines = String(textBlock).split(/\r?\n/);
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      if (system === 'DMS') {
        const parts = trimmed.split(/[,;\t]|\s{2,}/).map((p) => p.trim()).filter(Boolean);
        if (parts.length < 2) throw new Error(`Line ${i + 1}: need latitude and longitude separated by a comma`);
        points.push(readInput('DMS', parts[parts.length - 2], parts[parts.length - 1]));
        return;
      }
      const nums = trimmed.match(/-?\d+(?:\.\d+)?/g);
      if (!nums || nums.length < 2) throw new Error(`Line ${i + 1}: need two numbers`);
      const [x, y] = nums.slice(-2);
      points.push(readInput(system, x, y));
    });
    return points;
  }

  // True ground area in hectares of a ring of {lat, lng} points: cylindrical
  // equal-area projection on the WGS84 ellipsoid, then the shoelace formula.
  // Same calculation as areaHa on the server (src/geo.js).
  function areaHa(points) {
    if (points.length < 3) return 0;
    const a = 6378137, e2 = 0.00669437999014, e = Math.sqrt(e2), rad = Math.PI / 180;
    const q = (lat) => {
      const s = Math.sin(lat * rad);
      return (1 - e2) * (s / (1 - e2 * s * s) - (1 / (2 * e)) * Math.log((1 - e * s) / (1 + e * s)));
    };
    const lat0 = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const lng0 = points.reduce((s, p) => s + p.lng, 0) / points.length;
    const k0 = Math.cos(lat0 * rad) / Math.sqrt(1 - e2 * Math.sin(lat0 * rad) ** 2);
    const xy = points.map((p) => [a * k0 * (p.lng - lng0) * rad, (a * q(p.lat)) / (2 * k0)]);
    let twice = 0;
    for (let i = 0; i < xy.length; i++) {
      const [x1, y1] = xy[i];
      const [x2, y2] = xy[(i + 1) % xy.length];
      twice += x1 * y2 - x2 * y1;
    }
    return Math.abs(twice / 2) / 10000;
  }

  global.Coords = { SYSTEMS, areaHa, toLatLng, fromLatLng, utmZoneFor, ntmBeltFor, toDMS, parseDMS, describe, readInput, parseBeacons };
})(typeof window !== 'undefined' ? window : globalThis);
