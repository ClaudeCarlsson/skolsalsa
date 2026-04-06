/**
 * Scrape a sample of municipalities to populate the database for testing the explorer.
 * Uses the main scraping pipeline but only processes a subset.
 */
import { SessionManager } from './session.js';
import { parseTablePage } from './parser.js';
import { RateLimiter, withRetry, sleep, jitter } from './rate-limiter.js';
import { getDb, migrate } from '../../db/src/index.js';

const BATCH_SIZE = 15;
const limiter = new RateLimiter({ maxTokens: 2, refillRate: 1, minDelay: 600 });

// Sample municipalities: major cities + some smaller ones
const SAMPLE_MUNICIPALITIES = [
  '0180', // Stockholm
  '1480', // Göteborg
  '1280', // Malmö
  '0380', // Uppsala
  '0580', // Linköping
  '0680', // Jönköping
  '0162', // Danderyd
  '0184', // Solna
  '1281', // Lund
  '0182', // Nacka
];

async function main() {
  const db = getDb();
  migrate(db);
  const session = new SessionManager();

  const insertSchool = db.prepare(`
    INSERT OR REPLACE INTO school_units
    (school_code, name, municipality_code, municipality_name, is_public, is_active)
    VALUES (?, ?, ?, ?, 1, 1)
  `);
  const insertMuni = db.prepare(
    'INSERT OR REPLACE INTO municipalities (code, name) VALUES (?, ?)'
  );
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

  try {
    await session.init();

    // Save all municipalities from session
    db.transaction(() => {
      for (const m of session.municipalities) {
        insertMuni.run(m.code, m.name);
      }
    })();

    let totalRecords = 0;

    for (const muniCode of SAMPLE_MUNICIPALITIES) {
      const muniInfo = session.municipalities.find(m => m.code === muniCode);
      if (!muniInfo) continue;

      console.log(`\n=== ${muniInfo.name} (${muniCode}) ===`);

      // Discover schools
      await limiter.acquire();
      const schools = await withRetry(
        () => session.getSchoolsForMunicipality(muniCode),
        { label: `discover(${muniInfo.name})`, maxRetries: 3 }
      );

      console.log(`  Found ${schools.length} schools`);

      // Save schools
      db.transaction(() => {
        for (const s of schools) {
          insertSchool.run(s.code, s.name, muniCode, muniInfo.name);
        }
      })();

      // Process in batches
      for (let i = 0; i < schools.length; i += BATCH_SIZE) {
        const batch = schools.slice(i, i + BATCH_SIZE);
        console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} schools`);

        // Clear and set up
        await session.clearAllSchools();
        await session.selectAllYears();
        await sleep(200);

        // Select schools
        for (const s of batch) {
          await limiter.acquire();
          await session.addSchool(s.code);
        }
        await sleep(500 + jitter(300));

        // Get table
        const tableHtml = await withRetry(
          () => session.getTablePage(),
          { label: `table(${muniInfo.name} batch ${Math.floor(i / BATCH_SIZE)})`, maxRetries: 3 }
        );

        const records = parseTablePage(tableHtml);
        console.log(`    Parsed ${records.length} records`);

        // Build name-to-code mapping
        const nameToCode = new Map();
        for (const s of batch) {
          nameToCode.set(s.name.toLowerCase(), s.code);
        }

        // Insert records
        let batchInserted = 0;
        db.transaction(() => {
          for (const r of records) {
            if (!r.year) continue;
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
            if (!schoolCode) continue;

            insertResult.run(
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

        totalRecords += batchInserted;
        console.log(`    Inserted ${batchInserted} records (total: ${totalRecords})`);

        // Politeness pause between batches
        await sleep(2000 + jitter(1000));
      }
    }

    console.log(`\n=== Sample scrape complete ===`);
    console.log(`Total records: ${totalRecords}`);

    const stats = db.prepare(`
      SELECT COUNT(DISTINCT school_code) as schools,
             COUNT(*) as records,
             MIN(year) as min_year,
             MAX(year) as max_year
      FROM salsa_results
    `).get();
    console.log(`Database: ${stats.schools} schools, ${stats.records} records, ${stats.min_year}-${stats.max_year}`);

  } finally {
    await session.close();
    db.close();
  }
}

main().catch(err => {
  console.error('Sample scrape failed:', err);
  process.exit(1);
});
