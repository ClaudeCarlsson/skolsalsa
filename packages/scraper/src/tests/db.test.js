/**
 * Integration tests for database operations.
 * Uses a real SQLite database - NO mocking.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { getDb, migrate } from '../../../db/src/index.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { unlinkSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DB_PATH = join(__dirname, '..', '..', '..', '..', 'data', 'test-salsa.db');

describe('Database - real SQLite operations', () => {
  let db;

  before(() => {
    // Clean up any previous test DB
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
    db = getDb(TEST_DB_PATH);
    migrate(db);
  });

  after(() => {
    db.close();
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
      // Also clean up WAL files
      try { unlinkSync(TEST_DB_PATH + '-wal'); } catch {}
      try { unlinkSync(TEST_DB_PATH + '-shm'); } catch {}
    }
  });

  it('should create all required tables', () => {
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all().map(r => r.name);

    assert.ok(tables.includes('municipalities'), 'Should have municipalities table');
    assert.ok(tables.includes('organizations'), 'Should have organizations table');
    assert.ok(tables.includes('school_units'), 'Should have school_units table');
    assert.ok(tables.includes('salsa_results'), 'Should have salsa_results table');
    assert.ok(tables.includes('scrape_progress'), 'Should have scrape_progress table');
  });

  it('should create required indexes', () => {
    const indexes = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
    ).all().map(r => r.name);

    assert.ok(indexes.includes('idx_salsa_year'), 'Should have year index');
    assert.ok(indexes.includes('idx_salsa_school'), 'Should have school index');
    assert.ok(indexes.includes('idx_school_municipality'), 'Should have municipality index');
  });

  it('should insert and retrieve municipalities', () => {
    const insert = db.prepare('INSERT OR REPLACE INTO municipalities (code, name) VALUES (?, ?)');
    insert.run('0180', 'Stockholm');
    insert.run('1480', 'Göteborg');
    insert.run('1280', 'Malmö');

    const all = db.prepare('SELECT * FROM municipalities ORDER BY name').all();
    assert.equal(all.length, 3);
    assert.equal(all[0].name, 'Göteborg');
    assert.equal(all[1].name, 'Malmö');
    assert.equal(all[2].name, 'Stockholm');
  });

  it('should insert and retrieve school units', () => {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO school_units
      (school_code, name, municipality_code, municipality_name, is_public, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insert.run('44673074', 'Abrahamsbergsskolan', '0180', 'Stockholm', 1, 1);
    insert.run('99648792', 'Adolf Fredriks musikklasser', '0180', 'Stockholm', 1, 1);

    const schools = db.prepare('SELECT * FROM school_units WHERE municipality_code = ?').all('0180');
    assert.equal(schools.length, 2);
    assert.equal(schools[0].name, 'Abrahamsbergsskolan');
  });

  it('should insert and retrieve SALSA results', () => {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO salsa_results
      (school_code, school_name, municipality_name, year, huvudman,
       pct_parents_higher_ed, pct_newly_arrived, pct_born_abroad,
       pct_foreign_background, pct_boys,
       pct_eligible_gymnasiet, predicted_eligible, residual_eligible,
       avg_merit_value, predicted_merit_value, residual_merit,
       data_suppressed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run('44673074', 'Abrahamsbergsskolan', 'STOCKHOLM', 2024, 'Kom.',
      2.5, null, 7, 4, 52, 89, 86, 3, 240, 230, 10, 0);
    insert.run('44673074', 'Abrahamsbergsskolan', 'STOCKHOLM', 2023, 'Kom.',
      2.4, null, 8, 5, 48, 87, 85, 2, 235, 228, 7, 0);

    const results = db.prepare(
      'SELECT * FROM salsa_results WHERE school_code = ? ORDER BY year'
    ).all('44673074');
    assert.equal(results.length, 2);
    assert.equal(results[0].year, 2023);
    assert.equal(results[1].year, 2024);
    assert.equal(results[1].avg_merit_value, 240);
    assert.equal(results[1].residual_merit, 10);
  });

  it('should enforce unique constraint on school_code + year', () => {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO salsa_results
      (school_code, school_name, municipality_name, year, huvudman,
       avg_merit_value, predicted_merit_value, residual_merit, data_suppressed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Insert same school+year with different data - should update
    insert.run('44673074', 'Abrahamsbergsskolan', 'STOCKHOLM', 2024, 'Kom.', 250, 235, 15, 0);

    const results = db.prepare(
      'SELECT * FROM salsa_results WHERE school_code = ? AND year = ?'
    ).all('44673074', 2024);
    assert.equal(results.length, 1, 'Should have exactly 1 record (upsert)');
    assert.equal(results[0].avg_merit_value, 250, 'Should have updated value');
  });

  it('should handle NULL values correctly', () => {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO salsa_results
      (school_code, school_name, municipality_name, year, huvudman,
       pct_parents_higher_ed, pct_newly_arrived, pct_born_abroad,
       pct_foreign_background, pct_boys,
       pct_eligible_gymnasiet, predicted_eligible, residual_eligible,
       avg_merit_value, predicted_merit_value, residual_merit,
       data_suppressed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Insert the school unit first (FK constraint)
    db.prepare(`
      INSERT OR REPLACE INTO school_units
      (school_code, name, municipality_code, municipality_name, is_public, is_active)
      VALUES ('99999999', 'Test School', '0180', 'Stockholm', 1, 1)
    `).run();

    insert.run('99999999', 'Test School', 'TEST', 2024, 'Kom.',
      null, null, null, null, null, null, null, null, null, null, null, 1);

    const result = db.prepare(
      'SELECT * FROM salsa_results WHERE school_code = ?'
    ).get('99999999');
    assert.equal(result.avg_merit_value, null);
    assert.equal(result.data_suppressed, 1);
  });

  it('should track scrape progress', () => {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO scrape_progress
      (municipality_code, batch_index, status, started_at)
      VALUES (?, ?, ?, datetime('now'))
    `);

    insert.run('0180', 0, 'completed');
    insert.run('0180', 1, 'in_progress');
    insert.run('0180', 2, 'pending');

    const progress = db.prepare(
      'SELECT * FROM scrape_progress WHERE municipality_code = ? ORDER BY batch_index'
    ).all('0180');
    assert.equal(progress.length, 3);
    assert.equal(progress[0].status, 'completed');
    assert.equal(progress[1].status, 'in_progress');
    assert.equal(progress[2].status, 'pending');
  });

  it('should handle WAL mode correctly', () => {
    const mode = db.pragma('journal_mode', { simple: true });
    assert.equal(mode, 'wal');
  });

  it('should have foreign keys enabled', () => {
    const fk = db.pragma('foreign_keys', { simple: true });
    assert.equal(fk, 1);
  });
});
