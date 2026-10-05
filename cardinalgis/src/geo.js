// Node loader for the geography helpers: reads the Nigeria data files and
// hands them to the shared code in geo-core.js.
const path = require('path');
const fs = require('fs');
const createGeo = require('./geo-core');

const DATA_DIR = path.join(__dirname, '..', 'data');
const boundary = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'nigeria-boundary.geojson'), 'utf8'));
const admin = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'nigeria-admin.json'), 'utf8'));

module.exports = createGeo(boundary, admin);
// Rivers, lakes, towns and neighbour borders for drawing the offline map.
module.exports.basemap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'nigeria-basemap.json'), 'utf8'));
