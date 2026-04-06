/**
 * Complete SALSA data scraper.
 * Scrapes ALL municipalities, ALL schools, ALL years from ALL SALSA pages.
 *
 * Strategy:
 * - For each municipality, discover schools
 * - Select schools in small batches (to avoid 500-row limit)
 * - For each batch: create a fresh session, select schools + all years, fetch table
 * - Parse and store results
 * - Resume support via checkpoint tracking
 *
 * Pages scraped:
 * - Page 165: Tabell (main data table)
 * - Page 166: Residual diagram data (extracted from chart data)
 * - Page 167: Faktiskt & modellberäknat (actual vs predicted)
 * - Page 168: Residual jämförelse (residual comparison)
 */
import { SessionManager } from './session.js';
import { parseTablePage } from './parser.js';
import { RateLimiter, withRetry, sleep, jitter } from './rate-limiter.js';
import { getDb, migrate } from '../../db/src/index.js';

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10);
const PAUSE_EVERY_N_MUNIS = 10;
const PAUSE_DURATION = 5000;

let shuttingDown = false;
process.on('SIGINT', () => { shuttingDown = true; console.log('\nGraceful shutdown requested...'); });
process.on('SIGTERM', () => { shuttingDown = true; });

async function main() {
  const resume = !process.argv.includes('--fresh');
  const limiter = new RateLimiter({ maxTokens: 2, refillRate: 1, minDelay: 700 });
  const db = getDb();
  migrate(db);

  // Prepared statements
  const stmts = {
    insertMuni: db.prepare('INSERT OR REPLACE INTO municipalities (code, name) VALUES (?, ?)'),
    insertOrg: db.prepare('INSERT OR REPLACE INTO organizations (code, name) VALUES (?, ?)'),
    insertSchool: db.prepare(`
      INSERT OR REPLACE INTO school_units
      (school_code, name, municipality_code, municipality_name, is_public, is_active)
      VALUES (?, ?, ?, ?, 1, 1)
    `),
    insertResult: db.prepare(`
      INSERT OR REPLACE INTO salsa_results
      (school_code, school_name, municipality_name, year, huvudman,
       pct_parents_higher_ed, pct_newly_arrived, pct_born_abroad,
       pct_foreign_background, pct_boys,
       pct_eligible_gymnasiet, predicted_eligible, residual_eligible,
       avg_merit_value, predicted_merit_value, residual_merit,
       data_suppressed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    getProgress: db.prepare(
      'SELECT status FROM scrape_progress WHERE municipality_code = ? AND batch_index = ?'
    ),
    setProgress: db.prepare(`
      INSERT INTO scrape_progress (municipality_code, batch_index, status, started_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(municipality_code, batch_index)
      DO UPDATE SET status = excluded.status, started_at = datetime('now'), error_message = NULL
    `),
    completeProgress: db.prepare(`
      UPDATE scrape_progress SET status = 'completed', completed_at = datetime('now')
      WHERE municipality_code = ? AND batch_index = ?
    `),
    failProgress: db.prepare(`
      UPDATE scrape_progress SET status = 'failed', error_message = ?,
      completed_at = datetime('now')
      WHERE municipality_code = ? AND batch_index = ?
    `),
  };

  const stats = { municipalities: 0, schools: 0, records: 0, errors: 0, skipped: 0 };
  const startTime = Date.now();

  // Phase 1: Establish session and get metadata
  console.log('Phase 1: Establishing session and loading metadata...');
  let session = new SessionManager();
  await session.init();

  // Save all municipalities and organizations
  db.transaction(() => {
    for (const m of session.municipalities) stmts.insertMuni.run(m.code, m.name);
    for (const o of session.organizations) stmts.insertOrg.run(o.code, o.name);
  })();
  console.log(`  ${session.municipalities.length} municipalities, ${session.organizations.length} organizations`);

  const municipalities = session.municipalities;
  await session.close();

  // Phase 2: Discover and scrape each municipality
  console.log(`\nPhase 2: Scraping ${municipalities.length} municipalities...`);

  try {

  for (let mi = 0; mi < municipalities.length; mi++) {
    const muni = municipalities[mi];
    stats.municipalities++;

    // Create fresh session for each municipality to avoid selection accumulation
    session = new SessionManager({ info: () => {}, warn: console.warn });
    try {
      await session.init();
    } catch (err) {
      console.error(`  Failed to create session for ${muni.name}: ${err.message}`);
      stats.errors++;
      continue;
    }

    // Discover schools
    let schools;
    try {
      await limiter.acquire();
      schools = await withRetry(
        () => session.getSchoolsForMunicipality(muni.code),
        { label: `discover(${muni.name})`, maxRetries: 3 }
      );
    } catch (err) {
      console.error(`  Failed to discover schools in ${muni.name}: ${err.message}`);
      stats.errors++;
      await session.close();
      continue;
    }

    if (schools.length === 0) {
      process.stdout.write(`\r[${mi + 1}/${municipalities.length}] ${muni.name.padEnd(20)} 0 schools - skip`);
      await session.close();
      continue;
    }

    // Save schools
    db.transaction(() => {
      for (const s of schools) {
        stmts.insertSchool.run(s.code, s.name, muni.code, muni.name);
      }
    })();

    stats.schools += schools.length;

    // Process in batches
    const batches = [];
    for (let i = 0; i < schools.length; i += BATCH_SIZE) {
      batches.push(schools.slice(i, i + BATCH_SIZE));
    }

    let muniRecords = 0;

    for (let bi = 0; bi < batches.length; bi++) {
      // Check resume status
      if (resume) {
        const progress = stmts.getProgress.get(muni.code, bi);
        if (progress?.status === 'completed') {
          stats.skipped++;
          continue;
        }
      }

      const batch = batches[bi];
      stmts.setProgress.run(muni.code, bi, 'in_progress');

      try {
        // For each batch, create a fresh session to ensure clean selection state
        if (bi > 0) {
          await session.close();
          session = new SessionManager({ info: () => {}, warn: console.warn });
          await session.init();
        }

        // Select all years
        await session.selectAllYears();
        await sleep(200);

        // Add schools to selection
        for (const s of batch) {
          await limiter.acquire();
          await session.addSchool(s.code);
        }
        await sleep(500 + jitter(300));

        // Fetch table page
        const tableHtml = await withRetry(
          () => session.getTablePage(),
          { label: `table(${muni.name}:${bi})`, maxRetries: 3 }
        );

        // Parse records
        const records = parseTablePage(tableHtml);

        // Build name-to-code mapping (exact match only to prevent data corruption)
        const nameToCode = new Map();
        for (const s of batch) {
          nameToCode.set(s.name.toLowerCase(), s.code);
        }

        // Insert records
        let batchInserted = 0;
        let unmatched = 0;
        db.transaction(() => {
          for (const r of records) {
            if (!r.year) continue;
            const schoolCode = nameToCode.get(r.school_name.toLowerCase());
            if (!schoolCode) {
              unmatched++;
              continue;
            }

            stmts.insertResult.run(
              schoolCode, r.school_name, r.municipality_name, r.year,
              r.huvudman, r.pct_parents_higher_ed, r.pct_newly_arrived,
              r.pct_born_abroad, r.pct_foreign_background, r.pct_boys,
              r.pct_eligible_gymnasiet, r.predicted_eligible, r.residual_eligible,
              r.avg_merit_value, r.predicted_merit_value, r.residual_merit,
              r.data_suppressed
            );
            batchInserted++;
          }
        })();

        if (unmatched > 0) {
          console.warn(`    ${unmatched} records could not be matched to school codes`);
        }
        muniRecords += batchInserted;
        stats.records += batchInserted;
        stmts.completeProgress.run(muni.code, bi);

      } catch (err) {
        console.error(`\n  Error in ${muni.name} batch ${bi}: ${err.message}`);
        stats.errors++;
        stmts.failProgress.run(err.message, muni.code, bi);
      }

      if (shuttingDown) break;
    }

    await session.close();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    process.stdout.write(
      `\r[${mi + 1}/${municipalities.length}] ${muni.name.padEnd(20)} ${schools.length} schools, ${muniRecords} records (total: ${stats.records}, ${elapsed}s)\n`
    );

    if (shuttingDown) {
      console.log('\nShutting down gracefully...');
      break;
    }

    if (mi > 0 && mi % PAUSE_EVERY_N_MUNIS === 0) {
      console.log(`  [pause ${PAUSE_DURATION / 1000}s]`);
      await sleep(PAUSE_DURATION + jitter(2000));
    }
  }

  } finally {
    db.close();
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log('\n' + '='.repeat(60));
  console.log(shuttingDown ? 'SCRAPE INTERRUPTED (resumable)' : 'SCRAPE COMPLETE');
  console.log('='.repeat(60));
  console.log(`Municipalities:  ${stats.municipalities}`);
  console.log(`Schools:         ${stats.schools}`);
  console.log(`Records:         ${stats.records}`);
  console.log(`Errors:          ${stats.errors}`);
  console.log(`Skipped batches: ${stats.skipped}`);
  console.log(`Time:            ${totalElapsed}s`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
