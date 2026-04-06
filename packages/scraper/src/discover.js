/**
 * Discovery phase: enumerate all municipalities, organizations, and their schools.
 * Saves the full catalog to the database for later scraping.
 */
import { SessionManager } from './session.js';
import { RateLimiter, withRetry, sleep } from './rate-limiter.js';
import { getDb, migrate } from '../../db/src/index.js';

const limiter = new RateLimiter({ maxTokens: 2, refillRate: 1, minDelay: 800 });

async function main() {
  const db = getDb();
  migrate(db);

  const session = new SessionManager();

  try {
    await session.init();

    // Save municipalities
    const insertMunicipality = db.prepare(
      'INSERT OR REPLACE INTO municipalities (code, name) VALUES (?, ?)'
    );
    db.transaction(() => {
      for (const m of session.municipalities) {
        insertMunicipality.run(m.code, m.name);
      }
    })();
    console.log(`Saved ${session.municipalities.length} municipalities`);

    // Save organizations
    const insertOrg = db.prepare(
      'INSERT OR REPLACE INTO organizations (code, name) VALUES (?, ?)'
    );
    db.transaction(() => {
      for (const o of session.organizations) {
        insertOrg.run(o.code, o.name);
      }
    })();
    console.log(`Saved ${session.organizations.length} organizations`);

    // Discover schools per municipality
    const insertSchool = db.prepare(`
      INSERT OR REPLACE INTO school_units
        (school_code, name, municipality_code, municipality_name, is_public, is_active)
      VALUES (?, ?, ?, ?, 1, 1)
    `);

    let totalSchools = 0;
    const municipalities = session.municipalities;

    for (let i = 0; i < municipalities.length; i++) {
      const m = municipalities[i];
      process.stdout.write(`\r[${i + 1}/${municipalities.length}] ${m.name.padEnd(20)} `);

      await limiter.acquire();
      const schools = await withRetry(
        () => session.getSchoolsForMunicipality(m.code),
        { label: `getSchools(${m.name})`, maxRetries: 3 }
      );

      db.transaction(() => {
        for (const s of schools) {
          insertSchool.run(s.code, s.name, m.code, m.name);
        }
      })();

      totalSchools += schools.length;
      process.stdout.write(`${schools.length} schools (total: ${totalSchools})`);

      if (i > 0 && i % 30 === 0) {
        await sleep(3000);
      }
    }

    console.log(`\n\nDiscovery complete!`);
    console.log(`Total municipalities: ${municipalities.length}`);
    console.log(`Total schools found: ${totalSchools}`);

    const count = db.prepare('SELECT COUNT(*) as c FROM school_units').get();
    console.log(`Schools in database: ${count.c}`);

  } finally {
    await session.close();
    db.close();
  }
}

main().catch(err => {
  console.error('Discovery failed:', err);
  process.exit(1);
});
