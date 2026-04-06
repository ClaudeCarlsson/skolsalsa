/**
 * End-to-end integration test: full scrape pipeline.
 * Connects to real SIRIS, discovers schools, scrapes data, stores in DB.
 * NO mocking - verifies entire pipeline with real data.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { SessionManager } from '../session.js';
import { parseTablePage } from '../parser.js';
import { RateLimiter, sleep, withRetry } from '../rate-limiter.js';
import { getDb, migrate } from '../../../db/src/index.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { unlinkSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DB_PATH = join(__dirname, '..', '..', '..', '..', 'data', 'test-e2e.db');

describe('E2E - full scrape pipeline with real data', () => {
  let session;
  let db;
  const limiter = new RateLimiter({ maxTokens: 2, refillRate: 1, minDelay: 500 });

  before(async () => {
    if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH);
    db = getDb(TEST_DB_PATH);
    migrate(db);

    session = new SessionManager();
    await session.init();
  });

  after(async () => {
    await session.close();
    db.close();
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
      try { unlinkSync(TEST_DB_PATH + '-wal'); } catch {}
      try { unlinkSync(TEST_DB_PATH + '-shm'); } catch {}
    }
  });

  it('should complete full discovery + scrape for a small municipality', async () => {
    // Use Danderyd (0162) - small, reliable municipality
    const municipalityCode = '0162';
    const municipalityName = 'Danderyd';

    // Step 1: Discover schools
    await limiter.acquire();
    const schools = await withRetry(
      () => session.getSchoolsForMunicipality(municipalityCode),
      { label: 'discover', maxRetries: 3 }
    );

    assert.ok(schools.length > 0, `Should find schools in ${municipalityName}`);
    console.log(`  Found ${schools.length} schools in ${municipalityName}`);

    // Save to DB
    const insertSchool = db.prepare(`
      INSERT OR REPLACE INTO school_units
      (school_code, name, municipality_code, municipality_name, is_public, is_active)
      VALUES (?, ?, ?, ?, 1, 1)
    `);
    const insertMuni = db.prepare(
      'INSERT OR REPLACE INTO municipalities (code, name) VALUES (?, ?)'
    );

    insertMuni.run(municipalityCode, municipalityName);
    for (const s of schools) {
      insertSchool.run(s.code, s.name, municipalityCode, municipalityName);
    }

    // Step 2: Select schools and fetch data
    await session.clearAllSchools();
    await session.selectAllYears();
    await sleep(300);

    // Select first 3 schools
    const testSchools = schools.slice(0, 3);
    for (const s of testSchools) {
      await limiter.acquire();
      await session.addSchool(s.code);
    }
    await sleep(500);

    // Step 3: Fetch and parse table
    const tableHtml = await withRetry(
      () => session.getTablePage(),
      { label: 'getTable', maxRetries: 3 }
    );

    assert.ok(tableHtml.length > 1000, 'Should get substantial HTML');

    const records = parseTablePage(tableHtml);
    assert.ok(records.length > 0, `Should parse records, got ${records.length}`);
    console.log(`  Parsed ${records.length} records`);

    // Step 4: Insert into database
    const insertResult = db.prepare(`
      INSERT OR REPLACE INTO salsa_results
      (school_code, school_name, municipality_name, year, huvudman,
       pct_parents_higher_ed, pct_newly_arrived, pct_born_abroad,
       pct_foreign_background, pct_boys,
       pct_eligible_gymnasiet, predicted_eligible, residual_eligible,
       avg_merit_value, predicted_merit_value, residual_merit,
       data_suppressed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Build name-to-code mapping
    const nameToCode = new Map();
    for (const s of testSchools) {
      nameToCode.set(s.name.toLowerCase(), s.code);
    }

    let inserted = 0;
    db.transaction(() => {
      for (const r of records) {
        let schoolCode = nameToCode.get(r.school_name.toLowerCase());
        if (!schoolCode) {
          for (const [name, code] of nameToCode) {
            if (name.includes(r.school_name.toLowerCase()) ||
                r.school_name.toLowerCase().includes(name)) {
              schoolCode = code;
              break;
            }
          }
        }
        if (!schoolCode || !r.year) continue;

        insertResult.run(
          schoolCode, r.school_name, r.municipality_name, r.year,
          r.huvudman, r.pct_parents_higher_ed, r.pct_newly_arrived,
          r.pct_born_abroad, r.pct_foreign_background, r.pct_boys,
          r.pct_eligible_gymnasiet, r.predicted_eligible, r.residual_eligible,
          r.avg_merit_value, r.predicted_merit_value, r.residual_merit,
          r.data_suppressed
        );
        inserted++;
      }
    })();

    console.log(`  Inserted ${inserted} records into database`);
    assert.ok(inserted > 0, 'Should insert at least some records');

    // Step 5: Verify data integrity
    const dbResults = db.prepare(
      'SELECT * FROM salsa_results ORDER BY school_code, year'
    ).all();

    assert.ok(dbResults.length > 0, 'Database should have results');
    assert.equal(dbResults.length, inserted, 'DB count should match inserted count');

    // Verify data quality
    for (const r of dbResults) {
      assert.ok(r.school_code, 'Each record should have school_code');
      assert.ok(r.year >= 1998 && r.year <= 2026, `Year in range: ${r.year}`);

      if (r.avg_merit_value !== null) {
        assert.ok(r.avg_merit_value >= 0 && r.avg_merit_value <= 400,
          `Merit in range: ${r.avg_merit_value}`);
      }
    }

    // Verify we can query by school
    const schoolResults = db.prepare(
      'SELECT COUNT(*) as cnt FROM salsa_results WHERE school_code = ?'
    ).get(testSchools[0].code);
    assert.ok(schoolResults.cnt > 0, 'Should have results for first school');

    // Verify municipality reference
    const muniCheck = db.prepare(
      'SELECT * FROM municipalities WHERE code = ?'
    ).get(municipalityCode);
    assert.ok(muniCheck, 'Municipality should exist');
    assert.equal(muniCheck.name, municipalityName);

    console.log(`  E2E test passed: ${schools.length} schools discovered, ${inserted} records scraped and verified`);
  });
});
