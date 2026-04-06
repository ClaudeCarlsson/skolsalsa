/**
 * Integration tests for the HTML parser.
 * Tests against REAL data fetched from SIRIS - NO mocking.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { parseTablePage } from '../parser.js';
import { SessionManager } from '../session.js';
import { sleep } from '../rate-limiter.js';

describe('Parser - real SIRIS data parsing', () => {
  let session;
  let tableHtml;
  let records;

  before(async () => {
    session = new SessionManager();
    await session.init();

    // Select 3 well-known Stockholm schools and all years
    const schools = await session.getSchoolsForMunicipality('0180');
    const testSchools = schools.slice(0, 3);

    for (const s of testSchools) {
      await session.addSchool(s.code);
      await sleep(200);
    }
    await session.selectAllYears();
    await sleep(500);

    tableHtml = await session.getTablePage();
    records = parseTablePage(tableHtml);
  });

  after(async () => {
    await session.close();
  });

  it('should parse records from real SIRIS HTML', () => {
    assert.ok(records.length > 0, `Should parse records, got ${records.length}`);
    assert.ok(records.length >= 20, `Expected >=20 records from 3 schools, got ${records.length}`);
  });

  it('should extract year as integer', () => {
    for (const r of records) {
      assert.equal(typeof r.year, 'number', `Year should be number: ${r.year}`);
      assert.ok(r.year >= 1998 && r.year <= 2026, `Year should be in range: ${r.year}`);
    }
  });

  it('should extract municipality name', () => {
    for (const r of records) {
      assert.ok(r.municipality_name, `Should have municipality_name: ${JSON.stringify(r)}`);
      assert.ok(r.municipality_name.length > 0, 'Municipality name should not be empty');
    }
  });

  it('should extract school name', () => {
    for (const r of records) {
      assert.ok(r.school_name, `Should have school_name: ${JSON.stringify(r)}`);
      assert.ok(r.school_name.length > 0, 'School name should not be empty');
    }
  });

  it('should extract huvudman (owner type)', () => {
    for (const r of records) {
      assert.ok(r.huvudman, `Should have huvudman: ${JSON.stringify(r)}`);
      assert.ok(['Kom.', 'Ens.', 'Fri.'].includes(r.huvudman.trim()) ||
        r.huvudman.length > 0, `Unknown huvudman: ${r.huvudman}`);
    }
  });

  it('should extract numeric merit values', () => {
    const withMerit = records.filter(r => r.avg_merit_value !== null);
    assert.ok(withMerit.length > 0, 'Some records should have merit values');

    for (const r of withMerit) {
      assert.equal(typeof r.avg_merit_value, 'number', `Merit should be number: ${r.avg_merit_value}`);
      assert.ok(r.avg_merit_value >= 0 && r.avg_merit_value <= 400, `Merit value out of range: ${r.avg_merit_value}`);
    }
  });

  it('should extract predicted merit values', () => {
    const withPredicted = records.filter(r => r.predicted_merit_value !== null);
    assert.ok(withPredicted.length > 0, 'Some records should have predicted merit values');

    for (const r of withPredicted) {
      assert.equal(typeof r.predicted_merit_value, 'number');
      assert.ok(r.predicted_merit_value >= 0 && r.predicted_merit_value <= 400,
        `Predicted merit out of range: ${r.predicted_merit_value}`);
    }
  });

  it('should extract residual (actual - predicted)', () => {
    const withResidual = records.filter(r => r.residual_merit !== null);
    assert.ok(withResidual.length > 0, 'Some records should have residual values');

    for (const r of withResidual) {
      assert.equal(typeof r.residual_merit, 'number');
      // Residual should be approximately actual - predicted
      if (r.avg_merit_value !== null && r.predicted_merit_value !== null) {
        const expectedResidual = r.avg_merit_value - r.predicted_merit_value;
        assert.ok(Math.abs(r.residual_merit - expectedResidual) <= 2,
          `Residual ${r.residual_merit} should be close to ${expectedResidual} (actual=${r.avg_merit_value}, predicted=${r.predicted_merit_value})`);
      }
    }
  });

  it('should extract eligibility percentage', () => {
    const withEligible = records.filter(r => r.pct_eligible_gymnasiet !== null);
    assert.ok(withEligible.length > 0, 'Some records should have eligibility data');

    for (const r of withEligible) {
      assert.equal(typeof r.pct_eligible_gymnasiet, 'number');
      assert.ok(r.pct_eligible_gymnasiet >= 0 && r.pct_eligible_gymnasiet <= 100,
        `Eligibility out of range: ${r.pct_eligible_gymnasiet}`);
    }
  });

  it('should extract background information', () => {
    const withParents = records.filter(r => r.pct_parents_higher_ed !== null);
    assert.ok(withParents.length > 0, 'Some records should have parent education data');

    for (const r of withParents) {
      assert.equal(typeof r.pct_parents_higher_ed, 'number');
      assert.ok(r.pct_parents_higher_ed >= 1 && r.pct_parents_higher_ed <= 3,
        `Parent education out of range: ${r.pct_parents_higher_ed}`);
    }

    const withBoys = records.filter(r => r.pct_boys !== null);
    assert.ok(withBoys.length > 0, 'Some records should have gender data');

    for (const r of withBoys) {
      assert.ok(r.pct_boys >= 0 && r.pct_boys <= 100,
        `Boys percentage out of range: ${r.pct_boys}`);
    }
  });

  it('should handle suppressed data correctly', () => {
    // data_suppressed should be 0 or 1
    for (const r of records) {
      assert.ok(r.data_suppressed === 0 || r.data_suppressed === 1,
        `data_suppressed should be 0 or 1: ${r.data_suppressed}`);
    }
  });

  it('should cover all years from 1998 to present', () => {
    const years = new Set(records.map(r => r.year));
    assert.ok(years.has(1998) || years.has(1999), 'Should have data from late 1990s');
    assert.ok(years.has(2020) || years.has(2021), 'Should have recent data');
  });

  it('should return empty array for empty/invalid HTML', () => {
    assert.deepEqual(parseTablePage(''), []);
    assert.deepEqual(parseTablePage('<html><body>No table</body></html>'), []);
    assert.deepEqual(parseTablePage('<table></table>'), []);
  });
});
