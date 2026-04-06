/**
 * SALSA Data Scraper - Main Orchestrator
 *
 * Scrapes SALSA (Skolverkets Arbetsverktyg för Lokala SambandsAnalyser)
 * data for all schools across all years.
 *
 * Strategy:
 * 1. Load the school catalog from the database (run discover.js first)
 * 2. Process schools in batches by municipality
 * 3. For each batch: select schools, select all years, navigate to table, parse HTML
 * 4. Store results in SQLite with checkpointing for resume capability
 */
import { SessionManager } from './session.js';
import { RateLimiter, withRetry, sleep, jitter } from './rate-limiter.js';
import { parseTablePage } from './parser.js';
import { getDb, migrate } from '../../db/src/index.js';

const BATCH_SIZE = 15; // Schools per batch
const PAUSE_EVERY = 30; // Pause every N batches
const PAUSE_DURATION = 5000; // 5 second pause

const limiter = new RateLimiter({ maxTokens: 2, refillRate: 1.5, minDelay: 600 });

// Circuit breaker
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 10;
const CIRCUIT_BREAK_DURATION = 5 * 60 * 1000; // 5 minutes

class SalsaScraper {
  constructor(options = {}) {
    this.resume = options.resume ?? true;
    this.db = null;
    this.session = null;
    this.stats = {
      batchesProcessed: 0,
      recordsInserted: 0,
      errors: 0,
      startTime: Date.now(),
    };
  }

  async run() {
    this.db = getDb();
    migrate(this.db);
    this.prepareStatements();

    this.session = new SessionManager();

    try {
      await this.session.init();
      await this.session.selectAllYears();
      await sleep(500);

      // Get all municipalities to process
      const municipalities = this.db.prepare(
        'SELECT code, name FROM municipalities ORDER BY name'
      ).all();

      console.log(`Processing ${municipalities.length} municipalities...`);

      for (let i = 0; i < municipalities.length; i++) {
        const m = municipalities[i];
        await this.processMunicipality(m, i, municipalities.length);
      }

      this.printStats();

    } finally {
      await this.session?.close();
      this.db?.close();
    }
  }

  prepareStatements() {
    this.stmts = {
      getSchools: this.db.prepare(
        'SELECT school_code, name FROM school_units WHERE municipality_code = ? ORDER BY name'
      ),
      getBatchProgress: this.db.prepare(
        'SELECT status FROM scrape_progress WHERE municipality_code = ? AND batch_index = ?'
      ),
      upsertProgress: this.db.prepare(`
        INSERT INTO scrape_progress (municipality_code, batch_index, status, started_at)
        VALUES (?, ?, 'in_progress', datetime('now'))
        ON CONFLICT(municipality_code, batch_index)
        DO UPDATE SET status = 'in_progress', started_at = datetime('now'), error_message = NULL
      `),
      completeProgress: this.db.prepare(`
        UPDATE scrape_progress SET status = 'completed', completed_at = datetime('now')
        WHERE municipality_code = ? AND batch_index = ?
      `),
      failProgress: this.db.prepare(`
        UPDATE scrape_progress SET status = 'failed', error_message = ?,
        completed_at = datetime('now')
        WHERE municipality_code = ? AND batch_index = ?
      `),
      upsertResult: this.db.prepare(`
        INSERT INTO salsa_results (
          school_code, school_name, municipality_name, year, huvudman,
          pct_parents_higher_ed, pct_newly_arrived, pct_born_abroad,
          pct_foreign_background, pct_boys,
          pct_eligible_gymnasiet, predicted_eligible, residual_eligible,
          avg_merit_value, predicted_merit_value, residual_merit,
          data_suppressed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(school_code, year)
        DO UPDATE SET
          school_name = excluded.school_name,
          municipality_name = excluded.municipality_name,
          huvudman = excluded.huvudman,
          pct_parents_higher_ed = excluded.pct_parents_higher_ed,
          pct_newly_arrived = excluded.pct_newly_arrived,
          pct_born_abroad = excluded.pct_born_abroad,
          pct_foreign_background = excluded.pct_foreign_background,
          pct_boys = excluded.pct_boys,
          pct_eligible_gymnasiet = excluded.pct_eligible_gymnasiet,
          predicted_eligible = excluded.predicted_eligible,
          residual_eligible = excluded.residual_eligible,
          avg_merit_value = excluded.avg_merit_value,
          predicted_merit_value = excluded.predicted_merit_value,
          residual_merit = excluded.residual_merit,
          data_suppressed = excluded.data_suppressed,
          scraped_at = datetime('now')
      `),
    };
  }

  async processMunicipality(municipality, index, total) {
    const schools = this.stmts.getSchools.all(municipality.code);
    if (schools.length === 0) {
      console.log(`[${index + 1}/${total}] ${municipality.name}: no schools, skipping`);
      return;
    }

    console.log(`\n[${index + 1}/${total}] ${municipality.name}: ${schools.length} schools`);

    // Split into batches
    const batches = [];
    for (let i = 0; i < schools.length; i += BATCH_SIZE) {
      batches.push(schools.slice(i, i + BATCH_SIZE));
    }

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      // Check if already completed (resume support)
      if (this.resume) {
        const progress = this.stmts.getBatchProgress.get(municipality.code, batchIdx);
        if (progress?.status === 'completed') {
          console.log(`  Batch ${batchIdx + 1}/${batches.length}: already completed, skipping`);
          continue;
        }
      }

      await this.processBatch(municipality, batches[batchIdx], batchIdx, batches.length);

      // Periodic pause
      this.stats.batchesProcessed++;
      if (this.stats.batchesProcessed > 0 && this.stats.batchesProcessed % PAUSE_EVERY === 0) {
        console.log(`  Pausing for politeness (${this.stats.batchesProcessed} batches done)...`);
        await sleep(PAUSE_DURATION + jitter(2000));
      }
    }
  }

  async processBatch(municipality, schoolBatch, batchIdx, totalBatches) {
    console.log(`  Batch ${batchIdx + 1}/${totalBatches}: ${schoolBatch.length} schools`);
    this.stmts.upsertProgress.run(municipality.code, batchIdx);

    try {
      // Circuit breaker check
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.warn(`Circuit breaker: ${consecutiveFailures} consecutive failures. Pausing ${CIRCUIT_BREAK_DURATION / 1000}s...`);
        await sleep(CIRCUIT_BREAK_DURATION);
        consecutiveFailures = 0;
        await this.session.establish();
      }

      // Clear previous selection and select all years
      await this.session.clearAllSchools();
      await sleep(200);
      await this.session.selectAllYears();
      await sleep(200);

      // Add schools to selection
      for (const school of schoolBatch) {
        await limiter.acquire();
        await this.session.addSchool(school.school_code);
      }

      await sleep(500 + jitter(300));

      // Navigate to table page and get HTML
      const tableHtml = await withRetry(
        () => this.session.getTablePage(),
        { label: `getTable(${municipality.name} batch ${batchIdx})`, maxRetries: 3 }
      );

      // Parse the table
      const records = parseTablePage(tableHtml);
      console.log(`    Parsed ${records.length} records`);

      // Build name-to-code mapping for matching parsed records to school codes
      const nameToCode = new Map();
      for (const s of schoolBatch) {
        nameToCode.set(s.name.toLowerCase(), s.school_code);
      }

      // Insert into database
      if (records.length > 0) {
        const insertMany = this.db.transaction((records) => {
          for (const r of records) {
            if (!r.year) continue;

            // Match school name to code
            let schoolCode = nameToCode.get(r.school_name.toLowerCase());
            if (!schoolCode) {
              // Fuzzy match: try substring
              for (const [name, code] of nameToCode) {
                if (name.includes(r.school_name.toLowerCase()) ||
                    r.school_name.toLowerCase().includes(name)) {
                  schoolCode = code;
                  break;
                }
              }
            }
            if (!schoolCode) {
              // Use school name as fallback code
              schoolCode = `UNKNOWN_${r.school_name.replace(/\s+/g, '_').substring(0, 50)}`;
            }

            this.stmts.upsertResult.run(
              schoolCode, r.school_name, r.municipality_name, r.year,
              r.huvudman, r.pct_parents_higher_ed, r.pct_newly_arrived,
              r.pct_born_abroad, r.pct_foreign_background, r.pct_boys,
              r.pct_eligible_gymnasiet, r.predicted_eligible, r.residual_eligible,
              r.avg_merit_value, r.predicted_merit_value, r.residual_merit,
              r.data_suppressed
            );
            this.stats.recordsInserted++;
          }
        });
        insertMany(records);
      }

      this.stmts.completeProgress.run(municipality.code, batchIdx);
      consecutiveFailures = 0;

    } catch (err) {
      consecutiveFailures++;
      this.stats.errors++;
      console.error(`    Error: ${err.message}`);
      this.stmts.failProgress.run(err.message, municipality.code, batchIdx);
    }
  }

  printStats() {
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    console.log('\n=== Scraping Complete ===');
    console.log(`Batches processed: ${this.stats.batchesProcessed}`);
    console.log(`Records inserted:  ${this.stats.recordsInserted}`);
    console.log(`Errors:            ${this.stats.errors}`);
    console.log(`Time elapsed:      ${Math.round(elapsed)}s`);
    console.log(`Rate:              ${(this.stats.recordsInserted / elapsed).toFixed(1)} records/s`);
  }
}

// CLI
const args = process.argv.slice(2);
const options = {
  resume: !args.includes('--fresh'),
};

if (args.includes('--help')) {
  console.log(`
SALSA Scraper - Scrape school performance data from Skolverket SIRIS

Usage: node src/index.js [options]

Options:
  --fresh    Start from scratch (ignore checkpoints)
  --help     Show this help message

Run 'node src/discover.js' first to discover all schools.
  `);
  process.exit(0);
}

const scraper = new SalsaScraper(options);
scraper.run().catch(err => {
  console.error('Scraping failed:', err);
  process.exit(1);
});
