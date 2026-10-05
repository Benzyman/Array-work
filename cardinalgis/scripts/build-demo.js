// Builds dist/CardinalGIS-demo.html: the whole app in ONE file that works
// without the Node server. Double-click it to open it in a browser.
//
// It inlines every stylesheet, script, image and the font, embeds the Nigeria
// data and sample records, and adds demo/demo-api.js, which answers the app's
// /api/... requests inside the browser using the same rules as the server.
//
//   npm run build:demo
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const dataUri = (p, type) => `data:${type};base64,${fs.readFileSync(path.join(ROOT, p)).toString('base64')}`;
const MIME = { png: 'image/png', svg: 'image/svg+xml', woff2: 'font/woff2' };

// CSS with its url(images/...) references replaced by embedded data.
function inlineCss(file) {
  const dir = path.dirname(file);
  return read(file).replace(/url\((['"]?)(images\/[^'")]+)\1\)/g, (all, q, rel) => {
    const ext = rel.split('.').pop();
    return `url("${dataUri(path.join(dir, rel), MIME[ext])}")`;
  });
}

// Inline <script> content must never contain "</script".
const safeJs = (code) => code.replace(/<\/script/gi, '<\\/script');
const script = (code) => `<script>\n${safeJs(code)}\n</script>`;

// Sample data: the practice CSV (minus the row that is meant to fail) and one licence area.
const [header, ...rows] = read('samples/sample-sites.csv').trim().split(/\r?\n/);
const cols = header.split(',');
const sampleSites = rows
  .map((r) => Object.fromEntries(r.split(',').map((v, i) => [cols[i], v])))
  .filter((s) => !/should be rejected/i.test(s.name))
  .map((s) => ({ ...s, surveyor: 'Demo surveyor', survey_date: '2026-09-15' }));
const sampleArea = {
  name: 'Anka EL block (demo)', licence_type: 'Exploration Licence (EL)', licence_no: 'EL 0001',
  holder: 'Demo Mining Ltd', ownership: 'Privately owned', mineral: 'Gold', notes: 'Sample boundary for practice only',
  geometry: { type: 'Polygon', coordinates: [[[5.90, 12.08], [5.97, 12.08], [5.98, 12.13], [5.91, 12.14], [5.90, 12.08]]] },
};

const data = {
  boundary: JSON.parse(read('data/nigeria-boundary.geojson')),
  admin: JSON.parse(read('data/nigeria-admin.json')),
  basemap: JSON.parse(read('data/nigeria-basemap.json')),
  sampleSites,
  sampleArea,
};

const logo = dataUri('public/icons/logo.svg', MIME.svg);
const font = dataUri('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', MIME.woff2);

let html = read('public/index.html');
const swap = (from, to) => {
  if (!html.includes(from)) throw new Error(`build-demo: could not find ${from}`);
  html = html.replace(from, () => to);
};

swap('<title>CardinalGIS</title>', '<title>CardinalGIS Demo</title>');
swap('  <link rel="manifest" href="/manifest.webmanifest">\n', '');
swap('  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">\n', '');
swap('<link rel="icon" href="/icons/logo.svg" type="image/svg+xml">', `<link rel="icon" href="${logo}" type="image/svg+xml">`);
swap('<img src="/icons/logo.svg"', `<img src="${logo}"`);
swap('<a class="brand" href="/"', '<a class="brand" href="#"');
swap('<link rel="stylesheet" href="/vendor/leaflet/leaflet.css">', `<style>\n${inlineCss('node_modules/leaflet/dist/leaflet.css')}\n</style>`);
swap('<link rel="stylesheet" href="/vendor/leaflet-draw/leaflet.draw.css">', `<style>\n${inlineCss('node_modules/leaflet-draw/dist/leaflet.draw.css')}\n</style>`);
swap('<link rel="stylesheet" href="/css/style.css">', `<style>\n${read('public/css/style.css').replace("url('/vendor/inter/inter-latin-wght-normal.woff2')", `url("${font}")`)}\n</style>`);
swap('<script src="/js/theme.js"></script>', script(read('public/js/theme.js')));
swap('<script src="/vendor/leaflet/leaflet.js"></script>', script(read('node_modules/leaflet/dist/leaflet.js')));
swap('<script src="/vendor/leaflet-draw/leaflet.draw.js"></script>', script(read('node_modules/leaflet-draw/dist/leaflet.draw.js')));
swap('<script src="/vendor/proj4/proj4.js"></script>', script(read('node_modules/proj4/dist/proj4.js')));
swap('<script src="/js/coords.js"></script>', script(read('public/js/coords.js')));
swap('<script src="/js/app.js"></script>', [
  script(`window.CARDINAL_DATA = ${JSON.stringify(data)};`),
  script(read('src/constants.js')),
  script(read('src/geo-core.js')),
  script(read('src/records.js')),
  script(read('demo/demo-api.js')),
  script(read('public/js/app.js')),
].join('\n'));

if (/(src|href)="\/(?!\/|api\/export\/)/.test(html)) throw new Error('build-demo: a local /path reference was left in the page');

const out = path.join(ROOT, 'dist', 'CardinalGIS-demo.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`Wrote ${path.relative(ROOT, out)} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);

// A second copy shaped for hosting as a claude.ai Artifact: the host adds its own
// <html>/<head>/<body> skeleton with charset and viewport, so we publish only the
// head contents (title first) followed by the body contents.
const head = html.match(/<head>([\s\S]*)<\/head>/)[1]
  .replace(/\s*<meta charset="utf-8">/, '')
  .replace(/\s*<meta name="viewport"[^>]*>/, '');
const body = html.match(/<body>([\s\S]*)<\/body>/)[1];
const artifactOut = path.join(ROOT, 'dist', 'cardinalgis-demo-artifact.html');
fs.writeFileSync(artifactOut, `${head.trim()}\n${body.trim()}\n`);
console.log(`Wrote ${path.relative(ROOT, artifactOut)}`);
