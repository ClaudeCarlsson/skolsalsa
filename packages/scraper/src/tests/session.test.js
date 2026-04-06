/**
 * Integration tests for SessionManager.
 * ALL tests hit the real SIRIS API - NO mocking.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { SessionManager } from '../session.js';

describe('SessionManager - real SIRIS connection', () => {
  let session;

  before(async () => {
    session = new SessionManager();
    await session.init();
  });

  after(async () => {
    await session.close();
  });

  it('should establish a session with valid session ID', () => {
    assert.ok(session.sessionId, 'Session ID should be set');
    assert.match(session.sessionId, /^\d+$/, 'Session ID should be numeric');
  });

  it('should extract municipalities from the page', () => {
    assert.ok(session.municipalities.length > 0, 'Should have municipalities');
    assert.ok(session.municipalities.length >= 280, `Expected >=280 municipalities, got ${session.municipalities.length}`);

    // Verify known municipalities exist
    const stockholm = session.municipalities.find(m => m.name === 'Stockholm');
    assert.ok(stockholm, 'Stockholm should be in the list');
    assert.equal(stockholm.code, '0180', 'Stockholm code should be 0180');

    const goteborg = session.municipalities.find(m => m.name === 'Göteborg');
    assert.ok(goteborg, 'Göteborg should be in the list');
    assert.equal(goteborg.code, '1480', 'Göteborg code should be 1480');

    const malmo = session.municipalities.find(m => m.name === 'Malmö');
    assert.ok(malmo, 'Malmö should be in the list');
    assert.equal(malmo.code, '1280', 'Malmö code should be 1280');
  });

  it('should extract organizations from the page', () => {
    assert.ok(session.organizations.length > 0, 'Should have organizations');
    assert.ok(session.organizations.length >= 200, `Expected >=200 orgs, got ${session.organizations.length}`);

    // Verify a known org exists
    const ies = session.organizations.find(o => o.name.includes('Internationella Engelska'));
    assert.ok(ies, 'IES should be in the organization list');
  });

  it('should extract AJAX identifiers', () => {
    assert.ok(session.ajaxIds.kommun, 'Should have kommun AJAX ID');
    assert.ok(session.ajaxIds.org, 'Should have org AJAX ID');
    assert.ok(session.ajaxIds.skola, 'Should have skola AJAX ID');
    assert.ok(session.ajaxIds.skola.length > 20, 'AJAX ID should be a long hex string');
  });

  it('should discover schools for Stockholm (0180)', async () => {
    const schools = await session.getSchoolsForMunicipality('0180');
    assert.ok(schools.length > 0, 'Stockholm should have schools');
    assert.ok(schools.length >= 50, `Expected >=50 schools in Stockholm, got ${schools.length}`);

    // Each school should have code and name
    for (const s of schools) {
      assert.ok(s.code, `School should have code: ${JSON.stringify(s)}`);
      assert.ok(s.name, `School should have name: ${JSON.stringify(s)}`);
      assert.ok(s.code.length >= 5, `School code should be >=5 chars: ${s.code}`);
    }
  });

  it('should discover schools for a small municipality', async () => {
    // Dorotea (2425) - very small municipality
    const schools = await session.getSchoolsForMunicipality('2425');
    assert.ok(schools.length >= 1, `Dorotea should have at least 1 school, got ${schools.length}`);
  });

  it('should add and manage school selections', async () => {
    // Select a school
    const schools = await session.getSchoolsForMunicipality('0180');
    const testSchool = schools[0];
    assert.ok(testSchool, 'Should have at least one school to select');

    const result = await session.addSchool(testSchool.code);
    assert.ok(result, 'addSchool should return a response');

    // Clean up
    await session.removeSchool(testSchool.code);
  });

  it('should select all years', async () => {
    const result = await session.selectAllYears();
    assert.ok(result, 'selectAllYears should return a response');
  });

  it('should fetch the table page (page 165)', async () => {
    // First add a school and years
    const schools = await session.getSchoolsForMunicipality('0180');
    await session.addSchool(schools[0].code);
    await session.selectAllYears();

    const html = await session.getTablePage();
    assert.ok(html, 'Should get HTML response');
    assert.ok(html.length > 1000, `Table page should be substantial, got ${html.length} bytes`);
    assert.ok(html.includes('SALSA'), 'Table page should contain SALSA');

    // Clean up
    await session.removeSchool(schools[0].code);
  });

  it('should handle session refresh', async () => {
    const oldSessionId = session.sessionId;
    // Force a refresh by pretending the session is old
    session.lastRefresh = 0;
    await session.ensureFresh();
    // Session should still work (may or may not have new ID)
    assert.ok(session.sessionId, 'Should have a valid session after refresh');
  });

  it('should clear all school selections', async () => {
    // clearAllSchools returns void - just verify it does not throw
    await session.clearAllSchools();
    assert.ok(true, 'clearAllSchools should complete without error');
  });
});
