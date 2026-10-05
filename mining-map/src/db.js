// SQLite storage using Node's built-in `node:sqlite` module (Node 22.13+),
// so there is nothing native to compile when you deploy.
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function openDatabase(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  // Point features: mine sites, pits, sample points, boreholes, camps...
  db.exec(`
    CREATE TABLE IF NOT EXISTS sites (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      feature_type TEXT    NOT NULL DEFAULT 'Mine site',
      mineral      TEXT    NOT NULL DEFAULT 'Other',
      status       TEXT    NOT NULL DEFAULT 'Exploration',
      lat          REAL    NOT NULL,
      lng          REAL    NOT NULL,
      elevation_m  REAL,
      accuracy_m   REAL,
      state        TEXT,
      lga          TEXT,
      surveyor     TEXT,
      survey_date  TEXT,
      notes        TEXT,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sites_state   ON sites(state);
    CREATE INDEX IF NOT EXISTS idx_sites_mineral ON sites(mineral);
  `);

  // Polygon features: licence / lease boundaries, field blocks, pits outlines.
  db.exec(`
    CREATE TABLE IF NOT EXISTS areas (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      licence_type TEXT    NOT NULL DEFAULT 'Exploration Licence (EL)',
      licence_no   TEXT,
      holder       TEXT,
      mineral      TEXT    NOT NULL DEFAULT 'Other',
      geometry     TEXT    NOT NULL,
      area_ha      REAL    NOT NULL,
      state        TEXT,
      lga          TEXT,
      notes        TEXT,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

module.exports = { openDatabase };
