import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', '..', 'data');

export function getDb(dbPath) {
  const path = dbPath || join(DATA_DIR, 'salsa.db');
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS municipalities (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organizations (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS school_units (
      school_code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      municipality_code TEXT,
      municipality_name TEXT,
      organization_code TEXT,
      organization_name TEXT,
      is_public INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (municipality_code) REFERENCES municipalities(code)
    );

    CREATE TABLE IF NOT EXISTS salsa_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_code TEXT NOT NULL,
      school_name TEXT,
      municipality_name TEXT,
      year INTEGER NOT NULL,
      huvudman TEXT,
      pct_parents_higher_ed REAL,
      pct_newly_arrived REAL,
      pct_born_abroad REAL,
      pct_foreign_background REAL,
      pct_boys REAL,
      pct_eligible_gymnasiet REAL,
      predicted_eligible REAL,
      residual_eligible REAL,
      avg_merit_value REAL,
      predicted_merit_value REAL,
      residual_merit REAL,
      data_suppressed INTEGER DEFAULT 0,
      scraped_at TEXT DEFAULT (datetime('now')),
      UNIQUE(school_code, year),
      FOREIGN KEY (school_code) REFERENCES school_units(school_code)
    );

    CREATE TABLE IF NOT EXISTS scrape_progress (
      municipality_code TEXT NOT NULL,
      batch_index INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      started_at TEXT,
      completed_at TEXT,
      error_message TEXT,
      PRIMARY KEY (municipality_code, batch_index)
    );

    CREATE INDEX IF NOT EXISTS idx_salsa_year ON salsa_results(year);
    CREATE INDEX IF NOT EXISTS idx_salsa_school ON salsa_results(school_code);
    CREATE INDEX IF NOT EXISTS idx_school_municipality ON school_units(municipality_code);
    CREATE INDEX IF NOT EXISTS idx_school_org ON school_units(organization_code);
  `);
}
