/**
 * Database layer tests.
 * Tests all query functions against the REAL database. NO mocking.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getMunicipalities,
  getSchoolsByMunicipality,
  getSchoolResults,
  getSchool,
  searchSchools,
  getNationalTrends,
  getTopBottomSchools,
  compareSchools,
  getDashboardStats,
  getMunicipalityStats,
} from "../lib/db.js";

describe("DB: getMunicipalities", () => {
  it("should return array of municipalities", () => {
    const munis = getMunicipalities();
    assert.ok(Array.isArray(munis));
    assert.ok(munis.length > 0, `Expected municipalities, got ${munis.length}`);
  });

  it("each municipality should have code, name, school_count", () => {
    const munis = getMunicipalities();
    for (const m of munis) {
      assert.ok(m.code, `code missing: ${JSON.stringify(m)}`);
      assert.ok(m.name, `name missing: ${JSON.stringify(m)}`);
      assert.ok(
        typeof m.school_count === "number" && m.school_count > 0,
        `school_count invalid: ${JSON.stringify(m)}`
      );
    }
  });

  it("should be sorted (SQLite default collation)", () => {
    const munis = getMunicipalities();
    // SQLite uses binary collation by default - verify it's at least consistently ordered
    for (let i = 1; i < munis.length; i++) {
      assert.ok(
        munis[i].name >= munis[i - 1].name,
        `Not sorted: ${munis[i - 1].name} > ${munis[i].name}`
      );
    }
  });
});

describe("DB: getSchoolsByMunicipality", () => {
  it("should return schools for a known municipality", () => {
    const schools = getSchoolsByMunicipality("1490"); // Borås
    assert.ok(schools.length > 0, "Borås should have schools");
  });

  it("each school should have required fields", () => {
    const schools = getSchoolsByMunicipality("1490");
    for (const s of schools) {
      assert.ok(s.school_code, "school_code required");
      assert.ok(s.name, "name required");
    }
  });

  it("should return empty array for unknown municipality", () => {
    const schools = getSchoolsByMunicipality("9999");
    assert.deepEqual(schools, []);
  });
});

describe("DB: getSchoolResults", () => {
  it("should return results for a known school", () => {
    const results = getSchoolResults("10132939"); // Malmen Montessori
    assert.ok(results.length > 0, "Should have results");
  });

  it("results should be sorted by year ascending", () => {
    const results = getSchoolResults("10132939");
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i].year >= results[i - 1].year, "Not sorted by year");
    }
  });

  it("each result should have year and school_code", () => {
    const results = getSchoolResults("10132939");
    for (const r of results) {
      assert.ok(r.year >= 1998 && r.year <= new Date().getFullYear() + 1, `Year out of range: ${r.year}`);
      assert.equal(r.school_code, "10132939");
    }
  });

  it("should return empty array for unknown school", () => {
    const results = getSchoolResults("NONEXISTENT");
    assert.deepEqual(results, []);
  });
});

describe("DB: getSchool", () => {
  it("should return school for known code", () => {
    const school = getSchool("10132939");
    assert.ok(school, "Should find school");
    assert.equal(school!.school_code, "10132939");
    assert.ok(school!.name, "Should have name");
  });

  it("should return null for unknown code", () => {
    const school = getSchool("NONEXISTENT");
    assert.equal(school, null);
  });
});

describe("DB: searchSchools", () => {
  it("should find schools by name", () => {
    const results = searchSchools("Montessori");
    assert.ok(results.length > 0, "Should find Montessori schools");
  });

  it("should return empty for short query", () => {
    const results = searchSchools("a");
    assert.deepEqual(results, []);
  });

  it("should return empty for empty query", () => {
    const results = searchSchools("");
    assert.deepEqual(results, []);
  });

  it("should respect limit", () => {
    const results = searchSchools("skol", 3);
    assert.ok(results.length <= 3);
  });
});

describe("DB: getNationalTrends", () => {
  it("should return trend data", () => {
    const trends = getNationalTrends();
    assert.ok(trends.length > 0, "Should have trend data");
  });

  it("each trend should have required fields", () => {
    const trends = getNationalTrends();
    for (const t of trends) {
      assert.ok(typeof t.year === "number");
      assert.ok(typeof t.avg_merit === "number");
      assert.ok(typeof t.school_count === "number");
    }
  });

  it("trends should be sorted by year ascending", () => {
    const trends = getNationalTrends();
    for (let i = 1; i < trends.length; i++) {
      assert.ok(trends[i].year > trends[i - 1].year);
    }
  });
});

describe("DB: getTopBottomSchools", () => {
  it("should return top and bottom schools", () => {
    const { top, bottom } = getTopBottomSchools(2025, 5);
    assert.ok(top.length > 0, "Should have top schools");
    assert.ok(bottom.length > 0, "Should have bottom schools");
    assert.ok(top.length <= 5);
    assert.ok(bottom.length <= 5);
    // Top should have positive residuals, bottom negative
    if (top[0].residual_merit !== null) {
      assert.ok(top[0].residual_merit > 0);
    }
    if (bottom[0].residual_merit !== null) {
      assert.ok(bottom[0].residual_merit < 0);
    }
  });
});

describe("DB: compareSchools", () => {
  it("should return data for multiple schools", () => {
    const results = compareSchools(["10132939", "10257640"]);
    assert.ok(results.length > 0);
  });

  it("should return empty for empty array", () => {
    const results = compareSchools([]);
    assert.deepEqual(results, []);
  });

  it("results should be sorted by school_code then year", () => {
    const results = compareSchools(["10132939", "10257640"]);
    for (let i = 1; i < results.length; i++) {
      if (results[i].school_code === results[i - 1].school_code) {
        assert.ok(results[i].year >= results[i - 1].year);
      }
    }
  });
});

describe("DB: getDashboardStats", () => {
  it("should return stats with positive values", () => {
    const stats = getDashboardStats();
    assert.ok(stats.total_schools > 0, `total_schools: ${stats.total_schools}`);
    assert.ok(stats.total_records > 0, `total_records: ${stats.total_records}`);
    assert.ok(stats.min_year >= 1998, `min_year: ${stats.min_year}`);
    assert.ok(stats.max_year >= 2000, `max_year: ${stats.max_year}`);
  });
});

describe("DB: getMunicipalityStats", () => {
  it("should return stats for known municipality", () => {
    const stats = getMunicipalityStats("1490"); // Borås
    assert.ok(stats.length > 0);
  });

  it("should return empty for unknown municipality", () => {
    const stats = getMunicipalityStats("9999");
    assert.deepEqual(stats, []);
  });
});

