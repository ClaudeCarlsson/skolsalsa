import Database from "better-sqlite3";
import path from "path";
import { existsSync } from "fs";

// Use globalThis to survive Next.js HMR in development
const globalForDb = globalThis as unknown as { __salsaDb?: Database.Database };

export function getDb(): Database.Database {
  if (!globalForDb.__salsaDb) {
    const dbPath =
      process.env.DATABASE_PATH ||
      path.resolve(process.cwd(), "..", "..", "data", "salsa.db");

    if (!existsSync(dbPath)) {
      throw new Error("Database not available");
    }

    globalForDb.__salsaDb = new Database(dbPath, { readonly: true });
  }
  return globalForDb.__salsaDb;
}

function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

const MAX_SEARCH_LENGTH = 100;

export interface Municipality {
  code: string;
  name: string;
  school_count: number;
}

export interface SchoolUnit {
  school_code: string;
  name: string;
  municipality_code: string;
  municipality_name: string;
  organization_code: string | null;
  organization_name: string | null;
  is_public: number;
}

export interface SalsaResult {
  school_code: string;
  school_name: string;
  municipality_name: string;
  year: number;
  huvudman: string;
  pct_parents_higher_ed: number | null;
  pct_newly_arrived: number | null;
  pct_born_abroad: number | null;
  pct_foreign_background: number | null;
  pct_boys: number | null;
  pct_eligible_gymnasiet: number | null;
  predicted_eligible: number | null;
  residual_eligible: number | null;
  avg_merit_value: number | null;
  predicted_merit_value: number | null;
  residual_merit: number | null;
  data_suppressed: number;
}

export interface SchoolSummary {
  school_code: string;
  name: string;
  municipality_name: string;
  is_public: number;
  latest_year: number | null;
  latest_merit: number | null;
  latest_residual: number | null;
  latest_eligible: number | null;
  year_count: number;
}

export interface NationalTrend {
  year: number;
  avg_merit: number;
  avg_residual: number;
  avg_eligible: number;
  school_count: number;
}


// === Query functions ===

export function getMunicipalities(): Municipality[] {
  return getDb()
    .prepare(
      `SELECT m.code, m.name, COUNT(DISTINCT s.school_code) as school_count
       FROM municipalities m
       LEFT JOIN school_units s ON s.municipality_code = m.code
       GROUP BY m.code, m.name
       HAVING school_count > 0
       ORDER BY m.name`
    )
    .all() as Municipality[];
}

export function getSchoolsByMunicipality(
  municipalityCode: string
): SchoolSummary[] {
  return getDb()
    .prepare(
      `SELECT
         su.school_code, su.name, su.municipality_name, su.is_public,
         MAX(sr.year) as latest_year,
         (SELECT avg_merit_value FROM salsa_results WHERE school_code = su.school_code ORDER BY year DESC LIMIT 1) as latest_merit,
         (SELECT residual_merit FROM salsa_results WHERE school_code = su.school_code ORDER BY year DESC LIMIT 1) as latest_residual,
         (SELECT pct_eligible_gymnasiet FROM salsa_results WHERE school_code = su.school_code ORDER BY year DESC LIMIT 1) as latest_eligible,
         COUNT(DISTINCT sr.year) as year_count
       FROM school_units su
       LEFT JOIN salsa_results sr ON sr.school_code = su.school_code
       WHERE su.municipality_code = ?
       GROUP BY su.school_code
       ORDER BY su.name`
    )
    .all(municipalityCode) as SchoolSummary[];
}

export function getSchoolResults(schoolCode: string): SalsaResult[] {
  return getDb()
    .prepare(
      `SELECT * FROM salsa_results WHERE school_code = ? ORDER BY year ASC`
    )
    .all(schoolCode) as SalsaResult[];
}

export function getSchool(schoolCode: string): SchoolUnit | null {
  return (
    (getDb()
      .prepare(`SELECT * FROM school_units WHERE school_code = ?`)
      .get(schoolCode) as SchoolUnit | undefined) ?? null
  );
}

export function searchSchools(query: string, limit = 50): SchoolSummary[] {
  if (!query || query.length < 2 || query.length > MAX_SEARCH_LENGTH) return [];
  const escaped = escapeLike(query);
  return getDb()
    .prepare(
      `SELECT
         su.school_code, su.name, su.municipality_name, su.is_public,
         MAX(sr.year) as latest_year,
         (SELECT avg_merit_value FROM salsa_results WHERE school_code = su.school_code ORDER BY year DESC LIMIT 1) as latest_merit,
         (SELECT residual_merit FROM salsa_results WHERE school_code = su.school_code ORDER BY year DESC LIMIT 1) as latest_residual,
         (SELECT pct_eligible_gymnasiet FROM salsa_results WHERE school_code = su.school_code ORDER BY year DESC LIMIT 1) as latest_eligible,
         COUNT(DISTINCT sr.year) as year_count
       FROM school_units su
       LEFT JOIN salsa_results sr ON sr.school_code = su.school_code
       WHERE su.name LIKE ? ESCAPE '\\' OR su.municipality_name LIKE ? ESCAPE '\\'
       GROUP BY su.school_code
       ORDER BY su.name
       LIMIT ?`
    )
    .all(`%${escaped}%`, `%${escaped}%`, limit) as SchoolSummary[];
}

export function getNationalTrends(): NationalTrend[] {
  return getDb()
    .prepare(
      `SELECT
         year,
         ROUND(AVG(avg_merit_value), 1) as avg_merit,
         ROUND(AVG(residual_merit), 1) as avg_residual,
         ROUND(AVG(pct_eligible_gymnasiet), 1) as avg_eligible,
         COUNT(DISTINCT school_code) as school_count
       FROM salsa_results
       WHERE data_suppressed = 0 AND avg_merit_value IS NOT NULL
       GROUP BY year
       ORDER BY year ASC`
    )
    .all() as NationalTrend[];
}

export function compareSchools(schoolCodes: string[]): SalsaResult[] {
  if (schoolCodes.length === 0) return [];
  const limited = schoolCodes.slice(0, 10);
  const placeholders = limited.map(() => "?").join(",");
  return getDb()
    .prepare(
      `SELECT * FROM salsa_results
       WHERE school_code IN (${placeholders})
       ORDER BY school_code, year ASC`
    )
    .all(...limited) as SalsaResult[];
}

export function getDashboardStats() {
  return getDb()
    .prepare(
      `SELECT
         COUNT(DISTINCT school_code) as total_schools,
         COUNT(DISTINCT municipality_name) as total_municipalities,
         COUNT(*) as total_records,
         MIN(year) as min_year,
         MAX(year) as max_year
       FROM salsa_results`
    )
    .get() as {
    total_schools: number;
    total_municipalities: number;
    total_records: number;
    min_year: number;
    max_year: number;
  };
}

export function getMunicipalityStats(municipalityCode: string): NationalTrend[] {
  return getDb()
    .prepare(
      `SELECT
         sr.year,
         ROUND(AVG(sr.avg_merit_value), 1) as avg_merit,
         ROUND(AVG(sr.residual_merit), 1) as avg_residual,
         ROUND(AVG(sr.pct_eligible_gymnasiet), 1) as avg_eligible,
         COUNT(DISTINCT sr.school_code) as school_count
       FROM salsa_results sr
       JOIN school_units su ON su.school_code = sr.school_code
       WHERE su.municipality_code = ?
         AND sr.data_suppressed = 0
         AND sr.avg_merit_value IS NOT NULL
       GROUP BY sr.year
       ORDER BY sr.year ASC`
    )
    .all(municipalityCode) as NationalTrend[];
}


export interface DistributionStats {
  avg_merit: number;
  median_merit: number;
  min_merit: number;
  max_merit: number;
  avg_residual: number;
  positive_residual_count: number;
  negative_residual_count: number;
  total_count: number;
}

export function getYearDistribution(year: number): DistributionStats | null {
  const result = getDb()
    .prepare(
      `SELECT
         ROUND(AVG(avg_merit_value), 1) as avg_merit,
         MIN(avg_merit_value) as min_merit,
         MAX(avg_merit_value) as max_merit,
         ROUND(AVG(residual_merit), 1) as avg_residual,
         SUM(CASE WHEN residual_merit > 0 THEN 1 ELSE 0 END) as positive_residual_count,
         SUM(CASE WHEN residual_merit < 0 THEN 1 ELSE 0 END) as negative_residual_count,
         COUNT(*) as total_count
       FROM salsa_results
       WHERE year = ? AND data_suppressed = 0 AND avg_merit_value IS NOT NULL`
    )
    .get(year) as DistributionStats | undefined;

  if (!result || result.total_count === 0) return null;

  // Approximate median using offset
  const medianRow = getDb()
    .prepare(
      `SELECT avg_merit_value FROM salsa_results
       WHERE year = ? AND data_suppressed = 0 AND avg_merit_value IS NOT NULL
       ORDER BY avg_merit_value
       LIMIT 1 OFFSET ?`
    )
    .get(year, Math.floor(result.total_count / 2)) as { avg_merit_value: number } | undefined;

  result.median_merit = medianRow?.avg_merit_value ?? result.avg_merit;

  return result;
}

export function getTopBottomSchools(year: number, limit = 10) {
  const top = getDb()
    .prepare(
      `SELECT sr.school_code, sr.school_name, sr.municipality_name,
              sr.avg_merit_value, sr.predicted_merit_value, sr.residual_merit,
              sr.pct_eligible_gymnasiet
       FROM salsa_results sr
       WHERE sr.year = ? AND sr.data_suppressed = 0 AND sr.residual_merit IS NOT NULL
       ORDER BY sr.residual_merit DESC LIMIT ?`
    )
    .all(year, limit) as SalsaResult[];

  const bottom = getDb()
    .prepare(
      `SELECT sr.school_code, sr.school_name, sr.municipality_name,
              sr.avg_merit_value, sr.predicted_merit_value, sr.residual_merit,
              sr.pct_eligible_gymnasiet
       FROM salsa_results sr
       WHERE sr.year = ? AND sr.data_suppressed = 0 AND sr.residual_merit IS NOT NULL
       ORDER BY sr.residual_merit ASC LIMIT ?`
    )
    .all(year, limit) as SalsaResult[];

  return { top, bottom };
}

export function getMunicipalityRanking(year: number) {
  return getDb()
    .prepare(
      `SELECT
         su.municipality_code as code,
         su.municipality_name as name,
         ROUND(AVG(sr.avg_merit_value), 1) as avg_merit,
         ROUND(AVG(sr.residual_merit), 1) as avg_residual,
         ROUND(AVG(sr.pct_eligible_gymnasiet), 1) as avg_eligible,
         COUNT(DISTINCT sr.school_code) as school_count
       FROM salsa_results sr
       JOIN school_units su ON su.school_code = sr.school_code
       WHERE sr.year = ? AND sr.data_suppressed = 0 AND sr.avg_merit_value IS NOT NULL
       GROUP BY su.municipality_code
       HAVING school_count >= 2
       ORDER BY avg_merit DESC`
    )
    .all(year) as Array<{
    code: string;
    name: string;
    avg_merit: number;
    avg_residual: number;
    avg_eligible: number;
    school_count: number;
  }>;
}
