// Geography helpers: is a point in Nigeria, which state/LGA is it in,
// and how big is a polygon. Everything here works in WGS84 (lat/lng degrees).
//
// This file runs in Node (the server) AND in the browser (the offline demo),
// so it takes its data as arguments instead of reading files itself.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CardinalGeo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return function createGeo(boundary, admin) {
    // Nigeria's border as a list of polygons, each [outerRing, ...holes] of [lng, lat]
    // pairs. The detailed border is a MultiPolygon (mainland plus delta islands).
    const g = boundary.features[0].geometry;
    const NIGERIA_POLYGONS = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];

    // A generous box around Nigeria. Anything outside this is rejected immediately.
    const NIGERIA_BBOX = { minLat: 4.0, maxLat: 14.0, minLng: 2.6, maxLng: 14.8 };

    const statesById = new Map(admin.states.map((s) => [s.id, s]));

    // Ray-casting point-in-polygon test. ring = [[lng, lat], ...]
    function pointInRing(lng, lat, ring) {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        const crosses = (yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
        if (crosses) inside = !inside;
      }
      return inside;
    }

    function inBbox(lng, lat, [minLng, minLat, maxLng, maxLat]) {
      return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
    }

    // Great-circle distance in metres (haversine).
    function distanceMeters(lat1, lng1, lat2, lng2) {
      const R = 6371008.8;
      const toRad = Math.PI / 180;
      const dLat = (lat2 - lat1) * toRad;
      const dLng = (lng2 - lng1) * toRad;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    }

    function isValidLatLng(lat, lng) {
      return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }

    // Find the LGA a point most likely belongs to. The dataset only has
    // bounding boxes + centroids, so among the LGAs whose box contains the
    // point we pick the one with the nearest centroid. This is a good
    // approximation, not a legal boundary determination.
    function findLga(lat, lng) {
      let best = null;
      let bestDist = Infinity;
      for (const lga of admin.lgas) {
        if (!inBbox(lng, lat, lga.bbox)) continue;
        const d = distanceMeters(lat, lng, lga.lat, lga.lng);
        if (d < bestDist) {
          best = lga;
          bestDist = d;
        }
      }
      return best;
    }

    function nearestLga(lat, lng) {
      let best = null;
      let bestDist = Infinity;
      for (const lga of admin.lgas) {
        const d = distanceMeters(lat, lng, lga.lat, lga.lng);
        if (d < bestDist) {
          best = lga;
          bestDist = d;
        }
      }
      return best;
    }

    // How far (km) a point is from Nigeria's border or coastline.
    // Uses a flat local approximation, accurate to metres at these distances.
    const BORDER_TOLERANCE_KM = 2;
    function distanceToBorderKm(lat, lng) {
      const kx = 111.32 * Math.cos((lat * Math.PI) / 180);
      const ky = 110.57;
      let best = Infinity;
      for (const polygon of NIGERIA_POLYGONS) {
        for (const ring of polygon) {
          for (let i = 0; i < ring.length - 1; i++) {
            const ax = (ring[i][0] - lng) * kx, ay = (ring[i][1] - lat) * ky;
            const bx = (ring[i + 1][0] - lng) * kx, by = (ring[i + 1][1] - lat) * ky;
            const dx = bx - ax, dy = by - ay;
            const len2 = dx * dx + dy * dy;
            const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
            best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
          }
        }
      }
      return best;
    }

    // Main entry point: tell us everything we know about a coordinate.
    //   inNigeria   - inside Nigeria's border (Natural Earth 1:10m)
    //   nearBorder  - outside it, but within 2 km of the border or coastline:
    //                 border towns, lagoon shores and creeks the 1:10m line cuts
    //                 off. Accepted, with a warning to check the position.
    function locate(lat, lng) {
      if (!isValidLatLng(lat, lng)) {
        return { valid: false, inNigeria: false, nearBorder: false, state: null, lga: null };
      }
      const inBox = lat >= NIGERIA_BBOX.minLat && lat <= NIGERIA_BBOX.maxLat && lng >= NIGERIA_BBOX.minLng && lng <= NIGERIA_BBOX.maxLng;
      const inNigeria = inBox && NIGERIA_POLYGONS.some(([outer, ...holes]) => pointInRing(lng, lat, outer) && !holes.some((h) => pointInRing(lng, lat, h)));
      const nearBorder = !inNigeria && inBox && distanceToBorderKm(lat, lng) <= BORDER_TOLERANCE_KM;
      let lga = null;
      if (inNigeria || nearBorder) lga = findLga(lat, lng) || nearestLga(lat, lng);
      const state = lga ? statesById.get(lga.state) : null;
      return {
        valid: true,
        inNigeria,
        nearBorder,
        accepted: inNigeria || nearBorder,
        state: state ? state.name : null,
        stateId: state ? state.id : null,
        zone: state ? state.zone : null,
        lga: lga ? lga.name : null,
      };
    }

    // Area of a polygon ring ([[lng, lat], ...]) in square metres.
    // Each corner is projected with a Cylindrical Equal-Area projection on the
    // WGS84 ellipsoid (Snyder, "Map Projections: A Working Manual", eq. 3-12,
    // 10-15), so the flat shoelace area equals the true ground area. A simple
    // spherical formula is ~0.6% too big in Nigeria, which matters for licences.
    const WGS84_A = 6378137;
    const WGS84_E2 = 0.00669437999014;
    const WGS84_E = Math.sqrt(WGS84_E2);

    function authalicQ(latRad) {
      const s = Math.sin(latRad);
      return (1 - WGS84_E2) * (s / (1 - WGS84_E2 * s * s) - (1 / (2 * WGS84_E)) * Math.log((1 - WGS84_E * s) / (1 + WGS84_E * s)));
    }

    function ringAreaSqm(ring, centre) {
      if (ring.length < 3) return 0;
      const c = centre || ringCentre(ring);
      const rad = Math.PI / 180;
      const sinTs = Math.sin(c.lat * rad);
      const k0 = Math.cos(c.lat * rad) / Math.sqrt(1 - WGS84_E2 * sinTs * sinTs);
      const pts = ring.map(([lng, lat]) => [
        WGS84_A * k0 * (Number(lng) - c.lng) * rad,
        (WGS84_A * authalicQ(Number(lat) * rad)) / (2 * k0),
      ]);
      let twice = 0;
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        twice += x1 * y2 - x2 * y1;
      }
      return Math.abs(twice / 2);
    }

    function ringCentre(ring) {
      const closed = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
      const pts = closed ? ring.slice(0, -1) : ring;
      return {
        lng: pts.reduce((s, p) => s + Number(p[0]), 0) / pts.length,
        lat: pts.reduce((s, p) => s + Number(p[1]), 0) / pts.length,
      };
    }

    // Area of a GeoJSON Polygon geometry (outer ring minus holes), in hectares.
    function polygonAreaHa(geometry) {
      if (!geometry || geometry.type !== 'Polygon') return 0;
      const [outer, ...holes] = geometry.coordinates;
      const centre = ringCentre(outer);
      const sqm = ringAreaSqm(outer, centre) - holes.reduce((sum, h) => sum + ringAreaSqm(h, centre), 0);
      return sqm / 10000;
    }

    // Check a GeoJSON polygon is well formed and every vertex is in Nigeria.
    // Returns an error message, or null if it is fine.
    function validatePolygon(geometry) {
      if (!geometry || geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates)) {
        return 'geometry must be a GeoJSON Polygon';
      }
      const outer = geometry.coordinates[0];
      if (!Array.isArray(outer) || outer.length < 4) {
        return 'a polygon needs at least 3 corner points';
      }
      for (const ring of geometry.coordinates) {
        for (const pt of ring) {
          if (!Array.isArray(pt) || pt.length < 2) return 'invalid coordinate in polygon';
          const [lng, lat] = pt.map(Number);
          const loc = locate(lat, lng);
          if (!loc.valid) return 'invalid coordinate in polygon';
          if (!loc.accepted) return `corner ${lat.toFixed(5)}, ${lng.toFixed(5)} is outside Nigeria`;
        }
      }
      return null;
    }

    // Centre of a polygon's outer ring (vertex average, fine for small areas).
    function polygonCentroid(geometry) {
      return ringCentre(geometry.coordinates[0]);
    }

    return {
      NIGERIA_BBOX,
      states: admin.states,
      boundary,
      locate,
      distanceMeters,
      pointInRing,
      ringAreaSqm,
      polygonAreaHa,
      polygonCentroid,
      validatePolygon,
      isValidLatLng,
    };
  };
});
