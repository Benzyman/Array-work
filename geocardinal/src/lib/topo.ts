/**
 * Deterministic topographic contour generator.
 * Produces nested, organically perturbed closed curves around one or more
 * "summits", rendered once at build time as SVG path data.
 */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number];

/** Closed Catmull-Rom spline through points, as cubic Bézier path data. */
function smoothClosedPath(pts: Pt[]): string {
  const n = pts.length;
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

export type Summit = { x: number; y: number; rings: number; spacing: number; start?: number };

export type ContourLine = { d: string; index: boolean };

export function contours(summits: Summit[], seed = 7, samples = 72): ContourLine[] {
  const rand = mulberry32(seed);
  const lines: ContourLine[] = [];

  for (const s of summits) {
    // Harmonics shared by all rings of a summit keep them nested.
    const harmonics = [2, 3, 4, 5, 7].map((k) => ({
      k,
      amp: (0.16 / k) * (0.6 + rand()),
      phase: rand() * Math.PI * 2,
      drift: (rand() - 0.5) * 0.05,
    }));
    const stretch = 0.75 + rand() * 0.5;
    const tilt = rand() * Math.PI;

    for (let r = 0; r < s.rings; r++) {
      const base = (s.start ?? s.spacing) + r * s.spacing;
      const growth = 1 + r * 0.06;
      const pts: Pt[] = [];
      for (let i = 0; i < samples; i++) {
        const t = (i / samples) * Math.PI * 2;
        let m = 1;
        for (const h of harmonics) m += h.amp * growth * Math.sin(h.k * t + h.phase + h.drift * r);
        const rx = base * m * stretch;
        const ry = base * m;
        const x0 = Math.cos(t) * rx;
        const y0 = Math.sin(t) * ry;
        pts.push([s.x + x0 * Math.cos(tilt) - y0 * Math.sin(tilt), s.y + x0 * Math.sin(tilt) + y0 * Math.cos(tilt)]);
      }
      lines.push({ d: smoothClosedPath(pts), index: r % 5 === 4 });
    }
  }
  return lines;
}
