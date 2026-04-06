/**
 * Test connection to SIRIS and verify scraping approach.
 */
import { SessionManager } from './session.js';
import { parseTablePage } from './parser.js';
import { sleep } from './rate-limiter.js';
import { getDb, migrate } from '../../db/src/index.js';
import { writeFileSync } from 'fs';

async function main() {
  console.log('Testing SIRIS connection...\n');

  const session = new SessionManager();
  const db = getDb();
  migrate(db);

  try {
    await session.init();
    console.log(`✓ Session established: ${session.sessionId}`);
    console.log(`  Municipalities: ${session.municipalities.length}`);
    console.log(`  Organizations: ${session.organizations.length}`);
    console.log(`  AJAX IDs: ${JSON.stringify(session.ajaxIds)}`);

    // Save municipalities to DB
    const insertMun = db.prepare('INSERT OR REPLACE INTO municipalities (code, name) VALUES (?, ?)');
    const insertOrg = db.prepare('INSERT OR REPLACE INTO organizations (code, name) VALUES (?, ?)');
    db.transaction(() => {
      for (const m of session.municipalities) insertMun.run(m.code, m.name);
      for (const o of session.organizations) insertOrg.run(o.code, o.name);
    })();
    console.log(`✓ Saved ${session.municipalities.length} municipalities, ${session.organizations.length} organizations`);

    // Test school discovery for Stockholm
    console.log('\nDiscovering schools in Stockholm (0180)...');
    const schools = await session.getSchoolsForMunicipality('0180');
    console.log(`✓ Found ${schools.length} schools`);
    if (schools.length > 0) {
      console.log(`  Sample: ${schools.slice(0, 5).map(s => `${s.name} (${s.code})`).join(', ')}`);
    }

    // Test data extraction: select 3 schools, all years
    if (schools.length >= 3) {
      console.log('\nTesting data extraction...');

      // Clear and select all years
      await session.selectAllYears();
      await sleep(300);

      // Add 3 test schools
      const testSchools = schools.slice(0, 3);
      for (const s of testSchools) {
        await session.addSchool(s.code);
        console.log(`  Selected: ${s.name} (${s.code})`);
        await sleep(200);
      }

      await sleep(500);

      // Get table page
      console.log('  Fetching table page...');
      const tableHtml = await session.getTablePage();
      console.log(`  HTML size: ${(tableHtml.length / 1024).toFixed(1)} KB`);

      // Save for debugging
      writeFileSync('data/debug-table.html', tableHtml);
      console.log('  Saved to data/debug-table.html');

      // Parse
      const records = parseTablePage(tableHtml);
      console.log(`✓ Parsed ${records.length} records`);

      if (records.length > 0) {
        console.log('\n  Sample records:');
        for (const r of records.slice(0, 8)) {
          console.log(`    ${(r.school_name || r.school_code || '?').substring(0, 30).padEnd(30)} | yr=${r.year} | merit=${r.avg_merit_value} | residual=${r.residual_merit}`);
        }
      } else {
        console.log('  No records parsed - will need to analyze debug HTML');
        // Print a snippet of the HTML to debug
        const snippet = tableHtml.substring(0, 3000);
        console.log('\n  HTML snippet:');
        console.log(snippet.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 500));
      }

      // Clean up
      for (const s of testSchools) {
        await session.removeSchool(s.code);
      }
    }

    console.log('\n=== Test complete ===');

  } finally {
    await session.close();
    db.close();
  }
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
