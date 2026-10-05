# CardinalGIS

**CardinalGIS** is an installable web app for recording **mining coordinates and field mapping data across Nigeria**:
mine sites, pits, sample points, boreholes, beacons and **licence / lease boundaries**, shown on
an interactive map. It only accepts locations inside Nigeria.

> **New to this?** Read [BUILD_GUIDE.md](BUILD_GUIDE.md). It explains how the whole thing
> was built, step by step, and how to put it online.

## Features

| Area | What you can do |
|---|---|
| **Look and feel** | A clean interface with light and dark themes, an icon navigation rail, a floating coordinate readout and a north arrow. On phones it switches to a bottom tab bar with a slide-up panel and a centre crosshair. |
| **Install as an app** | Install it on Android, iPhone, Windows or Mac. It gets its own icon and window, and the app shell opens even with a weak signal. |
| **Go to coordinate** | Type `9.0579, 7.4951` or `9°03'28"N 7°29'42"E` in the top search bar to jump there, then add a site at that spot in one tap. |
| **Map** | Light, streets, satellite, terrain and dark base maps, locked to Nigeria with everything outside greyed out. Live cursor readout in lat/lng, DMS, UTM and Minna belt coordinates. Scale bar and mineral legend. |
| **Sites (points)** | Add by clicking the map, typing coordinates, or using your phone's GPS (accuracy and elevation are saved). Type, mineral, status, surveyor, date, notes. Search and filter by state and mineral. |
| **Nigeria-only** | Every coordinate is checked on the server. Points outside Nigeria are rejected. State and LGA are filled in automatically. |
| **Coordinate systems** | WGS84 decimal degrees and DMS, UTM zones 31N/32N/33N, Minna / UTM 31N/32N, and the Minna Nigeria West, Mid and East belts (NTM). Converter tab for quick conversions. |
| **Areas (polygons)** | Draw licence boundaries on the map, or paste beacon coordinates (e.g. from an MCO title or survey plan) in any supported system. Ground area is calculated on the WGS84 ellipsoid in hectares. You can edit a shape by dragging its corners and download its corner list as CSV. |
| **Licence info** | Title type (RP, EL, SSML, ML, QL, WUP), title number, holder, mineral. |
| **Tools** | Distance measuring, directions to a site (Google Maps), copy coordinates. |
| **Data** | Export to CSV, GeoJSON or KML (Google Earth). Import sites from CSV. Summary statistics. |
| **Security** | Optional `EDITOR_TOKEN`: anyone can view, but only people with the key can add, edit or delete. |
| **Phone friendly** | Works in a phone browser in the field. GPS capture needs HTTPS, which hosting gives you. |

## Run it on your computer

You need **Node.js 22.13 or newer** ([nodejs.org](https://nodejs.org)).

```bash
cd cardinalgis
npm install
npm start
```

Open <http://localhost:3000>. Try **Data → Import sites from CSV** with `samples/sample-sites.csv`.

### Install it as an app
- **Chrome or Edge on a computer:** click **Install** in the top bar, or the install icon in the address bar.
- **Android (Chrome):** menu ⋮ → **Install app** (or **Add to Home screen**).
- **iPhone (Safari):** Share → **Add to Home Screen**.

Installing works on `localhost`, and on any site served over **HTTPS** (every host in the build guide gives you HTTPS).

Run the automated tests with `npm test`.

## Settings (environment variables)

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | Port to listen on (hosts set this for you) |
| `DATA_DIR` | `./storage` | Folder where the SQLite database `mining.db` is stored |
| `EDITOR_TOKEN` | *(empty)* | If set, this key is needed to add, change or delete data |

## Project layout

```
cardinalgis/
├── server.js              starts the web server
├── src/
│   ├── app.js             API routes, validation, exports
│   ├── db.js              SQLite tables
│   ├── geo.js             Nigeria check, state/LGA lookup, area maths
│   └── constants.js       minerals, statuses, licence types
├── data/
│   ├── nigeria-boundary.geojson   national outline
│   └── nigeria-admin.json         37 states + 774 LGAs (centres and bounding boxes)
├── public/                the website (HTML, CSS, JS)
│   ├── js/app.js          map, forms, drawing, import/export
│   ├── js/coords.js       coordinate systems and conversions
│   ├── manifest.webmanifest + sw.js   make it an installable app
│   └── icons/             logo and app icons
├── test/                  automated tests (node:test)
├── samples/               sample CSV for practice
└── Dockerfile             container image for deployment
```

## API

All responses are JSON. Writes need `Authorization: Bearer <EDITOR_TOKEN>` when a token is set.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/meta` | Pick-lists, states, whether a key is required |
| GET | `/api/locate?lat=&lng=` | Is it in Nigeria? Which state and LGA? |
| GET/POST | `/api/sites` | List (filters: `state`, `mineral`, `status`, `q`) / create |
| GET/PUT/DELETE | `/api/sites/:id` | Read / update / delete one site |
| POST | `/api/sites/bulk` | `{ "sites": [...] }` import many sites |
| GET/POST | `/api/areas` | List / create polygons (`geometry` is GeoJSON Polygon) |
| GET/PUT/DELETE | `/api/areas/:id` | Read / update / delete one area |
| GET | `/api/stats` | Counts by mineral and state |
| GET | `/api/export/csv` · `/geojson` · `/kml` | Downloads |

## Limitations (please read)

- **State and LGA names are approximate.** The open dataset has LGA centre points and bounding
  boxes, not exact LGA borders, so points near an LGA or state border may get the neighbouring name.
- **The national outline is simplified** (about 58 points). Points just outside the outline but
  inside a border LGA's box are accepted with a "near the border" warning.
- This is a mapping and record-keeping tool. **It is not a legal cadastral survey.** Official
  title boundaries come from the Mining Cadastre Office and registered surveyors.

## Data credits

- National outline: Natural Earth via [johan/world.geo.json](https://github.com/johan/world.geo.json) (public domain).
- States and LGAs: [`@some19ice/nigeria-geo-core`](https://www.npmjs.com/package/@some19ice/nigeria-geo-core) (MIT).
- Map tiles: © OpenStreetMap contributors, CARTO, Esri World Imagery, OpenTopoMap. The free CARTO and
  OpenStreetMap tile services have fair-use limits. For heavy commercial use, get a tile provider
  key (for example MapTiler or Stadia) and swap the URLs in `public/js/app.js`.
- Font: Inter (SIL Open Font License), served from the app itself.
