# How the Nigeria Mining Map was built: a step-by-step guide

This guide walks through how the platform was built, in the order it was built. By the end you
should be able to rebuild it yourself, change it, and put it online.

Each step explains **what** we did, **why**, and **which file** holds the code. Keep the code open
next to this guide as you read.

---

## Step 0: The big picture

A web platform has two halves:

```
 ┌──────────────────────────── Browser (phone / laptop) ────────────────────────────┐
 │  index.html + style.css + app.js                                                │
 │  • Leaflet draws the map and tiles                                               │
 │  • proj4 converts coordinates (UTM, Minna belts…)                                │
 │  • Leaflet.draw lets you draw boundaries                                         │
 └───────────────▲───────────────────────────────────────────┬──────────────────────┘
                 │ JSON over HTTPS  (fetch('/api/sites') …)  │
 ┌───────────────┴──────────────── Server (Node.js) ─────────▼──────────────────────┐
 │  server.js → src/app.js (Express routes)                                          │
 │             src/geo.js   "is this in Nigeria? which state/LGA? how many hectares?"│
 │             src/db.js    SQLite database file (storage/mining.db)                 │
 └───────────────────────────────────────────────────────────────────────────────────┘
```

- The **front end** (browser) is what people see and click.
- The **back end** (server) stores the data and enforces the rules, for example "only Nigeria".
  We never trust the browser alone, because anyone can bypass browser code.
- They talk through an **API**: URLs that send and receive JSON.

**Technology choices, and why:**

| Choice | Why |
|---|---|
| **Node.js + Express** | JavaScript on both sides, so there is one language to learn. Express is the most common, simplest web framework. |
| **SQLite** (built into Node 22) | A full SQL database stored in one file. Nothing to install or compile. |
| **Leaflet** | Small, beginner-friendly, free map library. |
| **proj4js** | The standard library for converting between coordinate systems. |
| **Plain HTML/CSS/JS** (no React) | Nothing to build or compile, so you can read every line. |

---

## Step 1: Install your tools

1. **Node.js 22 LTS** from <https://nodejs.org>. Check it with `node -v` (it must be 22.13 or newer).
2. **Git** from <https://git-scm.com>, for saving versions and deploying.
3. **VS Code** from <https://code.visualstudio.com>, a good free code editor.
4. A **GitHub** account, so hosting services can pull your code.

---

## Step 2: Create the project

```bash
mkdir mining-map && cd mining-map
npm init -y                                  # creates package.json
npm install express@4 leaflet leaflet-draw proj4
```

- `package.json` lists your dependencies and **scripts**. We added:
  ```json
  "scripts": {
    "start": "node --disable-warning=ExperimentalWarning server.js",
    "dev":   "node --watch --disable-warning=ExperimentalWarning server.js",
    "test":  "node --disable-warning=ExperimentalWarning --test test/*.test.js"
  },
  "engines": { "node": ">=22.13" }
  ```
  `npm run dev` restarts the server automatically whenever you save a file. Use it while coding.
- `node_modules/` is where packages are downloaded. Never commit it, so it goes in `.gitignore`.

Folders we created: `src/` (server code), `public/` (website), `data/` (geography), `test/`.

---

## Step 3: Get Nigeria's geography (`data/`)

To enforce "Nigeria only" and to name the state and LGA, we need geographic data.

1. **National outline:** `data/nigeria-boundary.geojson`. This is a GeoJSON polygon of Nigeria
   from Natural Earth (public domain). **GeoJSON** is the standard text format for map shapes:
   ```json
   { "type": "Polygon", "coordinates": [[ [8.50, 4.77], [7.46, 4.41], ... ]] }
   ```
   ⚠️ GeoJSON order is **[longitude, latitude]**, which is the opposite of how people say it.
   This trips up everyone at least once.

2. **States and LGAs:** `data/nigeria-admin.json`. This holds all 37 states and 774 LGAs, each with
   a centre point and a **bounding box** `[minLng, minLat, maxLng, maxLat]`. It was extracted from
   the MIT-licensed npm package `@some19ice/nigeria-geo-core` with a one-off script: download the
   package (`npm pack @some19ice/nigeria-geo-core`), load its arrays, keep only the fields we need,
   round to 5 decimals (about 1 m), and write JSON. The result is about 100 KB.

> **Upgrade idea:** with real LGA border polygons (for example from geoBoundaries or GRID3
> Nigeria), you could replace the bounding-box guess with an exact point-in-polygon test.

---

## Step 4: The geography engine (`src/geo.js`)

This is the heart of "Nigeria only". The main concepts:

### 4a. Point-in-polygon (ray casting)
To know if a point is inside Nigeria's outline, imagine shooting a ray from the point to the
east. Count how many times it crosses the border: **odd means inside, even means outside**.
See `pointInRing()`. It is about ten lines and worth understanding.

### 4b. A quick rejection box
Before the polygon test we check a rough rectangle around Nigeria (`NIGERIA_BBOX`). It's cheap
and instantly rejects London or Lagos, Portugal.

### 4c. Which LGA and state?
`findLga()` looks at all 774 LGAs and keeps those whose bounding box contains the point. If
several match (boxes overlap), it picks the one whose **centre is nearest** (haversine
distance, `distanceMeters()`). The state comes from that LGA.

### 4d. Border tolerance
The outline is simplified, so a real Nigerian village right on the border might fall a few
hundred metres "outside". `locate()` therefore returns:
- `inNigeria`: inside the outline,
- `nearBorder`: outside the outline but inside a border LGA's box (accepted with a warning),
- `accepted`: true if either one holds.

### 4e. Area in hectares
For licence areas, accuracy matters. The common spherical formula is about **0.6% too big** at
Nigeria's latitudes, which is 6 ha on a 1,000 ha licence. So `ringAreaSqm()` projects every
corner with an **equal-area projection on the WGS84 ellipsoid** (Snyder's cylindrical
equal-area formulas) and then uses the flat **shoelace formula**. A test proves that a
1 km × 1 km UTM square comes out at 100.01 ha, which is the correct value.

Try it yourself:
```bash
node -e "const g=require('./src/geo'); console.log(g.locate(9.06, 7.49))"
```

---

## Step 5: The database (`src/db.js`)

We use `node:sqlite`, which is built into Node 22, so there is nothing to install. There are two
tables:

- **`sites`** (points): name, feature_type, mineral, status, lat, lng, elevation, GPS accuracy,
  state, LGA, surveyor, survey_date, notes, timestamps.
- **`areas`** (polygons): name, licence_type, licence_no, holder, mineral, **geometry**
  (GeoJSON stored as text), area_ha, state, LGA, notes.

`CREATE TABLE IF NOT EXISTS` makes it safe to run every time the server starts.
`journal_mode = WAL` makes SQLite handle reads and writes at the same time better.

> **Why not PostgreSQL/PostGIS?** It's more powerful, but it's another server to run and pay for.
> SQLite easily handles thousands of sites and a team of surveyors. You can switch later.

---

## Step 6: The API server (`src/app.js` + `server.js`)

`server.js` reads the settings (`PORT`, `DATA_DIR`, `EDITOR_TOKEN`), opens the database and
starts the app. `src/app.js` builds the app. The two are separate so that the tests can create
an app with a throw-away in-memory database.

### 6a. Routes
Express maps **HTTP method + URL** to a function:

```js
api.get('/sites', (req, res) => res.json(listSites(req.query)));
api.post('/sites', requireEditor, (req, res) => { ... res.status(201).json(newSite); });
```

This follows the REST convention: `GET` reads, `POST` creates, `PUT` updates, `DELETE` removes.

### 6b. Validation: never trust input
`parseSite()` and `parseArea()` check every field (required, length, number range, allowed
list, date format). They also **recompute state and LGA from the coordinates on the server**,
so nobody can save a Ghana point labelled "Lagos". Bad input throws a `ValidationError`, which
the error handler turns into **HTTP 400** with a clear message.

### 6c. SQL injection safety
Every query uses **placeholders** (`?` or `:name`) and never glues user text into SQL:
```js
db.prepare('SELECT * FROM sites WHERE state = ?').all(state);
```

### 6d. Editor key (simple access control)
If `EDITOR_TOKEN` is set, `requireEditor` demands the header
`Authorization: Bearer <token>` on every change. Viewing stays public. The comparison uses
`crypto.timingSafeEqual` so that an attacker can't guess the key by measuring response times.

### 6e. Exports
- **CSV**: values are quoted correctly, and cells starting with `=`, `+`, `-` or `@` are prefixed
  so that Excel won't run them as formulas (a real attack called "CSV injection").
- **GeoJSON**: for QGIS and ArcGIS.
- **KML**: for Google Earth. Text is XML-escaped.

### 6f. Serving the website
`express.static` serves `public/`, and Leaflet, Leaflet.draw and proj4 are served straight from
`node_modules`. That means no CDN is needed, and the app still loads its code on networks
that block CDNs.

### 6g. Security headers
A **Content-Security-Policy** says "only run scripts from this site". This is a strong defence if
anyone ever manages to slip HTML into a site name. We also escape all user text before putting
it in the page (`esc()` in `app.js`).

---

## Step 7: Coordinate systems (`public/js/coords.js`)

Nigerian field data comes in several systems, and this file is what makes the app useful to
surveyors:

| System | Where you meet it |
|---|---|
| WGS84 lat/lng (decimal or DMS) | Phone GPS, Google Maps |
| **UTM 31N / 32N / 33N** (WGS84) | Handheld GPS units, modern surveys. Nigeria spans three zones: west of 6°E, 6–12°E, and east of 12°E. |
| **Minna datum** | Nigeria's national datum, used on older survey plans and cadastral documents |
| **Nigeria West / Mid / East Belt (NTM)** | Transverse Mercator belts on the Minna datum (EPSG 26391–26393) |

Each system is a **proj4 definition string**, for example:
```
Minna / Nigeria Mid Belt:
+proj=tmerc +lat_0=4 +lon_0=8.5 +k=0.99975 +x_0=670553.98 +y_0=0
+ellps=clrk80 +towgs84=-92,-93,122,0,0,0,0 +units=m
```
`+towgs84=-92,-93,122` shifts from Minna to WGS84. That is why the same spot has coordinates
about 140 m apart in Minna and WGS84 UTM. Mixing them up is a classic field error.

Other helpers: `toDMS`/`parseDMS` (accepts `9°4'30"N`, `9 4 30 N`, `-9 4 30` and similar),
`describe()` (one point in every system, used for the live readout bar), and `parseBeacons()`
(reads lines like `PB1 335000.00 1001000.00` and uses the last two numbers on each line).

---

## Step 8: The map app (`public/index.html`, `css/style.css`, `js/app.js`)

### 8a. Layout
A side panel with four tabs (Sites, Areas, Convert, Data) and a full-height map. On phones
(`@media (max-width: 760px)`) the panel moves below the map, so it works in the field.

### 8b. Creating the map
```js
const map = L.map('map', { maxBounds: [[1.5, -0.5], [16.5, 18]], minZoom: 5 });
map.fitBounds([[4.2, 2.7], [13.9, 14.7]]);           // Nigeria
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
```
Three base layers are offered: Streets (OpenStreetMap), Satellite (Esri) and Terrain
(OpenTopoMap).

### 8c. Greying out other countries
The mask is a polygon covering the whole world with Nigeria cut out as a **hole**:
`L.polygon([worldRing, nigeriaRing])`. It's a simple trick with a strong visual effect.

### 8d. Talking to the API
One helper, `api(method, url, body)`, wraps `fetch`, adds the editor key and turns errors into
messages. Everything else calls it, for example `await api('POST', '/api/sites', body)`.

### 8e. Modes
Clicking the map can mean different things: add a site, draw a boundary, measure, or edit a
shape. A single `state.mode` variable plus `startMode()` and `endMode()` keeps this tidy and
shows a banner with a Cancel button.

### 8f. Forms
These use the HTML `<dialog>` element (built-in modals). The site form lets you pick the
coordinate system; switching system **converts what you typed**. While you type, it asks
`/api/locate` and shows "✔ Jos South, Plateau" or "✖ outside Nigeria" before you save.

### 8g. Drawing and editing boundaries
Leaflet.draw provides `new L.Draw.Polygon(map).enable()`. When the polygon is finished we
convert it to GeoJSON and open the area form. **Edit shape** calls `layer.editing.enable()`, so
you can drag the corners and then press Save.

### 8h. GPS
`navigator.geolocation.getCurrentPosition(..., { enableHighAccuracy: true })` gives lat, lng,
accuracy and sometimes altitude. ⚠️ Browsers only allow GPS on **HTTPS** sites (and on
`localhost`). Hosting gives you HTTPS automatically.

### 8i. CSV import
A small CSV parser (it handles quoted commas) reads the file in the browser and posts all rows
to `/api/sites/bulk`. The server saves the good rows and reports the bad ones by row number.

---

## Step 9: Testing

Run `npm test`. The tests use Node's built-in runner (`node:test`), so there's nothing to install.

- `test/geo.test.js`: Nigerian cities resolve to the correct state; Cotonou, Douala, Niamey and
  N'Djamena are rejected; area maths is accurate.
- `test/api.test.js`: starts the real app on a random port with an in-memory database and checks
  create, read, update and delete, rejection of foreign points, bulk import, exports, CSV
  injection protection and the editor key.

The front end was also checked in a real (headless) Chrome with **Playwright**: adding sites by
click, by UTM and by DMS; rejecting Cotonou; beacon entry giving 100 ha; drawing a polygon;
converting; importing a CSV; and the phone layout. No JavaScript errors were found.

> **Habit to build:** every time you fix a bug, add a test that would have caught it.

---

## Step 10: Put it online

You need a host that runs Node.js **and keeps the database file** between restarts.

### Option A: Render (easiest, about US$7/month for the disk)
1. Push your code to GitHub.
2. Go to <https://render.com>, sign up with GitHub, then choose **New → Blueprint** and pick
   your repo. The `render.yaml` at the repository root sets everything up: the Node web
   service in `mining-map/`, a 1 GB persistent disk at `/var/data`, and a random
   `EDITOR_TOKEN`.
3. When it's live, open the service's **Environment** tab, copy `EDITOR_TOKEN`, and paste it into
   the app under **Data → Editor key**.
4. Your site is at `https://nigeria-mining-map.onrender.com` (or similar) with HTTPS included.

> A free Render web service works too, but it has **no persistent disk**, so data is wiped on
> every restart or redeploy. That's fine for a demo, but not for real data.

### Option B: Railway / Fly.io (Docker)
Both can build the included `Dockerfile`. Attach a **volume** mounted at `/data` (the
Dockerfile sets `DATA_DIR=/data`) and set `EDITOR_TOKEN`.

### Option C: Your own VPS (DigitalOcean, Hetzner, AWS Lightsail, or a Nigerian provider)
```bash
# on the server, with Docker installed
git clone <your repo> && cd <repo>/mining-map
docker build -t mining-map .
docker run -d --restart=always -p 3000:3000 -v mining-data:/data \
  -e EDITOR_TOKEN='choose-a-long-random-key' --name mining-map mining-map
```
Then put **Caddy** or **Nginx** in front for HTTPS and your domain. Caddy does HTTPS
automatically with a two-line config: `yourdomain.ng { reverse_proxy localhost:3000 }`.

### Backups (important!)
All data lives in one file: `mining.db` in `DATA_DIR`. Copy it regularly. Also use **Data →
Export → GeoJSON** as an extra, human-readable backup.

---

## Step 11: Ideas for what to build next

1. **User accounts and roles** (admin, surveyor, viewer) instead of one shared key, so each
   record shows who created it.
2. **Exact LGA borders** (geoBoundaries or GRID3) for precise state and LGA names.
3. **Photo uploads** for each site (pit faces, samples, beacons).
4. **Offline mode (PWA)**: record in the bush without network and sync later.
5. **Shapefile import and export** for GIS teams.
6. **Overlap check**: warn when a new licence area overlaps an existing one.
7. **PostgreSQL + PostGIS** when you have many users or very large datasets.

---

## Quick reference

```bash
npm install          # once, after cloning
npm run dev          # develop (auto-restart)
npm test             # run tests
npm start            # run like production
EDITOR_TOKEN=abc123 npm start      # protect editing (macOS/Linux)
set EDITOR_TOKEN=abc123 && npm start   # Windows cmd
```

Good luck, and happy mapping! 🇳🇬⛏️
