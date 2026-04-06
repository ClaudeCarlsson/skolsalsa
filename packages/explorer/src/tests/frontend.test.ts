/**
 * Complete frontend integration test suite.
 *
 * Feedback loop:
 *   1. Build the Next.js app (done before tests)
 *   2. Start the production server on a random port
 *   3. Hit every route with fetch, verify HTML content
 *   4. Verify real data from the database appears in responses
 *   5. Verify error states, empty states, edge cases
 *   6. Stop the server
 *
 * NO mocking. Real database. Real server. Real HTTP requests.
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 3847; // Use uncommon port to avoid conflicts
const BASE = `http://localhost:${PORT}`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPLORER_DIR = path.resolve(__dirname, "..", "..");

let serverProcess: ChildProcess;
const serverOutput: string[] = [];

async function waitForServer(maxWaitMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const resp = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(2000) });
      if (resp.ok || resp.status === 500) {
        // Server is up (500 is OK - means server runs, page may error)
        return;
      }
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(
    `Server did not start within ${maxWaitMs}ms. Output:\n${serverOutput.join("\n")}`
  );
}

async function fetchPage(path: string): Promise<{ status: number; html: string; headers: Headers }> {
  const resp = await fetch(`${BASE}${path}`, {
    headers: { Accept: "text/html" },
    signal: AbortSignal.timeout(10_000),
  });
  const html = await resp.text();
  return { status: resp.status, html, headers: resp.headers };
}

// Strip RSC comment boundaries so text matching works across React children
function normalizeHtml(html: string): string {
  return html.replace(/<!-- -->/g, "");
}

// Helper: assert HTML contains text (case-insensitive)
function assertContains(html: string, text: string, msg?: string) {
  const norm = normalizeHtml(html);
  assert.ok(
    norm.toLowerCase().includes(text.toLowerCase()),
    msg || `Expected HTML to contain "${text}" (got ${html.length} bytes)`
  );
}

function assertNotContains(html: string, text: string, msg?: string) {
  const norm = normalizeHtml(html);
  assert.ok(
    !norm.toLowerCase().includes(text.toLowerCase()),
    msg || `Expected HTML NOT to contain "${text}"`
  );
}

// ============================================================
// Server lifecycle
// ============================================================
before(async () => {
  console.log("  Starting Next.js production server...");

  serverProcess = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: EXPLORER_DIR,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(PORT),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout?.on("data", (data: Buffer) => {
    const line = data.toString().trim();
    if (line) serverOutput.push(`[stdout] ${line}`);
  });
  serverProcess.stderr?.on("data", (data: Buffer) => {
    const line = data.toString().trim();
    if (line) serverOutput.push(`[stderr] ${line}`);
  });
  serverProcess.on("error", (err) => {
    serverOutput.push(`[error] ${err.message}`);
  });

  await waitForServer();
  console.log(`  Server ready on port ${PORT}`);
});

after(async () => {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    // Give it a moment to shut down gracefully
    await new Promise((r) => setTimeout(r, 1000));
    if (!serverProcess.killed) {
      serverProcess.kill("SIGKILL");
    }
    console.log("  Server stopped");
  }
});

// ============================================================
// DASHBOARD (/)
// ============================================================
describe("Dashboard /", () => {
  it("should return 200", async () => {
    const { status } = await fetchPage("/");
    assert.equal(status, 200);
  });

  it("should contain page title", async () => {
    const { html } = await fetchPage("/");
    assertContains(html, "SALSA Explorer");
  });

  it("should show statistics cards with real numbers", async () => {
    const { html } = await fetchPage("/");
    // Should have "Schools", "Municipalities", "Data Points", "Year Range"
    assertContains(html, "Schools");
    assertContains(html, "Municipalities");
    assertContains(html, "Data Points");
    // Year range should contain actual years from DB
    assertContains(html, "1998");
  });

  it("should contain navigation links", async () => {
    const { html } = await fetchPage("/");
    assertContains(html, "href=\"/municipalities\"");
    assertContains(html, "href=\"/search\"");
    assertContains(html, "href=\"/compare\"");
    assertContains(html, "href=\"/trends\"");
  });

  it("should contain top schools table", async () => {
    const { html } = await fetchPage("/");
    assertContains(html, "Outperformers");
    assertContains(html, "Residual");
  });

  it("should not contain error messages", async () => {
    const { html } = await fetchPage("/");
    assertNotContains(html, "Database not found");
    assertNotContains(html, "Run the scraper first");
  });

  it("should have proper HTML structure", async () => {
    const { html } = await fetchPage("/");
    assertContains(html, "<!DOCTYPE html");
    assertContains(html, "<html");
    assertContains(html, "lang=\"sv\"");
    assertContains(html, "</html>");
  });
});

// ============================================================
// MUNICIPALITIES (/municipalities)
// ============================================================
describe("Municipalities /municipalities", () => {
  it("should return 200", async () => {
    const { status } = await fetchPage("/municipalities");
    assert.equal(status, 200);
  });

  it("should list municipalities with counts", async () => {
    const { html } = await fetchPage("/municipalities");
    assertContains(html, "Kommuner");
    // Should contain known municipality names
    assertContains(html, "schools"); // "X schools" text
  });

  it("should link to municipality detail pages", async () => {
    const { html } = await fetchPage("/municipalities");
    // Links should be /municipality/CODE format
    assertContains(html, "href=\"/municipality/");
  });

  it("should not show error state", async () => {
    const { html } = await fetchPage("/municipalities");
    assertNotContains(html, "Could not load");
    assertNotContains(html, "No municipalities found");
  });
});

// ============================================================
// MUNICIPALITY DETAIL (/municipality/[code])
// ============================================================
describe("Municipality detail /municipality/[code]", () => {
  // Use a municipality code we know has data
  const MUNI_CODE = "1490"; // Borås - has schools in our test data

  it("should return 200 for valid municipality", async () => {
    const { status } = await fetchPage(`/municipality/${MUNI_CODE}`);
    assert.equal(status, 200);
  });

  it("should show municipality name and school list", async () => {
    const { html } = await fetchPage(`/municipality/${MUNI_CODE}`);
    // Should show schools
    assertContains(html, "schools");
    // Should have table with merit/residual headers
    assertContains(html, "Merit");
    assertContains(html, "Residual");
  });

  it("should link to school detail pages", async () => {
    const { html } = await fetchPage(`/municipality/${MUNI_CODE}`);
    assertContains(html, "href=\"/school/");
  });

  it("should have back link to municipalities", async () => {
    const { html } = await fetchPage(`/municipality/${MUNI_CODE}`);
    assertContains(html, "/municipalities");
  });

  it("should handle unknown municipality gracefully", async () => {
    const { status } = await fetchPage("/municipality/9999");
    // Should still return 200 (with empty state), not 500
    assert.equal(status, 200);
  });
});

// ============================================================
// SCHOOL DETAIL (/school/[code])
// ============================================================
describe("School detail /school/[code]", () => {
  const SCHOOL_CODE = "10132939"; // Malmen Montessori - known to have data

  it("should return 200 for valid school", async () => {
    const { status } = await fetchPage(`/school/${SCHOOL_CODE}`);
    assert.equal(status, 200);
  });

  it("should show school name", async () => {
    const { html } = await fetchPage(`/school/${SCHOOL_CODE}`);
    assertContains(html, "Malmen Montessori");
  });

  it("should show merit values from real data", async () => {
    const { html } = await fetchPage(`/school/${SCHOOL_CODE}`);
    // Should contain actual numeric merit values
    assertContains(html, "Merit");
    // The school has merit value 215 in 2011 - should appear in data table
    assertContains(html, "2011");
  });

  it("should show residual values", async () => {
    const { html } = await fetchPage(`/school/${SCHOOL_CODE}`);
    assertContains(html, "Residual");
  });

  it("should show data table with all years", async () => {
    const { html } = await fetchPage(`/school/${SCHOOL_CODE}`);
    assertContains(html, "All Data");
    assertContains(html, "Year");
  });

  it("should handle unknown school code", async () => {
    const { status, html } = await fetchPage("/school/NONEXISTENT");
    assert.equal(status, 200);
    assertContains(html, "not found");
  });

  it("should have back link to municipality", async () => {
    const { html } = await fetchPage(`/school/${SCHOOL_CODE}`);
    assertContains(html, "/municipality/");
  });
});

// ============================================================
// SEARCH (/search)
// ============================================================
describe("Search /search", () => {
  it("should return 200 with no query", async () => {
    const { status } = await fetchPage("/search");
    assert.equal(status, 200);
  });

  it("should show search input", async () => {
    const { html } = await fetchPage("/search");
    assertContains(html, "search");
    assertContains(html, "<input");
  });

  it("API should return results for valid query", async () => {
    const resp = await fetch(`${BASE}/api/search?q=Montessori`, { signal: AbortSignal.timeout(10_000) });
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.ok(data.length > 0, "Should find Montessori schools");
    assert.ok(data[0].school_code);
    assert.ok(data[0].name);
  });

  it("API should return results for municipality name", async () => {
    const resp = await fetch(`${BASE}/api/search?q=Stockholm`, { signal: AbortSignal.timeout(10_000) });
    const data = await resp.json();
    assert.ok(data.length > 0, "Should find Stockholm schools");
  });

  it("API should return empty for gibberish query", async () => {
    const resp = await fetch(`${BASE}/api/search?q=zzzznonexistent999`, { signal: AbortSignal.timeout(10_000) });
    const data = await resp.json();
    assert.deepEqual(data, []);
  });

  it("API should return empty for short query", async () => {
    const resp = await fetch(`${BASE}/api/search?q=a`, { signal: AbortSignal.timeout(10_000) });
    const data = await resp.json();
    assert.deepEqual(data, []);
  });
});

// ============================================================
// COMPARE (/compare)
// ============================================================
describe("Compare /compare", () => {
  it("should return 200 with no schools selected", async () => {
    const { status } = await fetchPage("/compare");
    assert.equal(status, 200);
  });

  it("should show compare input form", async () => {
    const { html } = await fetchPage("/compare");
    assertContains(html, "Compare Schools");
    assertContains(html, "<input");
  });

  it("should render with initial school pills when codes provided", async () => {
    const { status, html } = await fetchPage(
      "/compare?schools=10132939,10257640"
    );
    assert.equal(status, 200);
    // Server renders the selected school names as pills
    assertContains(html, "Malmen Montessori");
  });

  it("API should return comparison data", async () => {
    const resp = await fetch(`${BASE}/api/compare?schools=10132939,10257640`, { signal: AbortSignal.timeout(10_000) });
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.ok(data.length > 0, "Should return comparison records");
    assert.ok(data[0].school_code);
    assert.ok(data[0].year);
  });

  it("should handle invalid school codes gracefully", async () => {
    const { status } = await fetchPage("/compare?schools=INVALID");
    assert.equal(status, 200); // Should not crash
  });
});

// ============================================================
// TRENDS (/trends)
// ============================================================
describe("Trends /trends", () => {
  it("should return 200", async () => {
    const { status } = await fetchPage("/trends");
    assert.equal(status, 200);
  });

  it("should show national trend data", async () => {
    const { html } = await fetchPage("/trends");
    assertContains(html, "National Trends");
    assertContains(html, "Average Merit Value");
    assertContains(html, "School Count");
  });

  it("should show yearly data table", async () => {
    const { html } = await fetchPage("/trends");
    assertContains(html, "Yearly Data");
    assertContains(html, "Avg Merit");
    assertContains(html, "Avg Eligible");
    // Should contain actual year numbers
    assertContains(html, "199"); // 1998 or 1999
  });

  it("should not show error state", async () => {
    const { html } = await fetchPage("/trends");
    assertNotContains(html, "Could not load");
    assertNotContains(html, "No trend data");
  });
});

// ============================================================
// LAYOUT & NAVIGATION
// ============================================================
describe("Layout and navigation", () => {
  it("should have consistent header on all pages", async () => {
    const pages = ["/", "/municipalities", "/search", "/compare", "/trends"];
    for (const page of pages) {
      const { html } = await fetchPage(page);
      assertContains(html, "SkolSalsa", `Header missing on ${page}`);
    }
  });

  it("should have footer with Skolverket attribution", async () => {
    const { html } = await fetchPage("/");
    assertContains(html, "Skolverket");
    assertContains(html, "siris.skolverket.se");
  });

  it("should return 404 for non-existent routes", async () => {
    const { status } = await fetchPage("/nonexistent-page");
    assert.equal(status, 404);
  });
});

// ============================================================
// DATA INTEGRITY CHECKS
// ============================================================
describe("Data integrity in rendered pages", () => {
  it("should show real numeric merit values (not placeholders)", async () => {
    const { html } = await fetchPage("/school/10132939");
    // Malmen Montessori has merit 215 in 2011 - verify actual numbers appear
    const meritMatch = html.match(/>\s*(\d{3})\s*</);
    assert.ok(meritMatch, "Should find 3-digit merit values in the HTML");
    const merit = parseInt(meritMatch![1]);
    assert.ok(
      merit >= 100 && merit <= 400,
      `Merit value ${merit} should be in realistic range`
    );
  });

  it("should show signed residual values", async () => {
    const { html } = await fetchPage("/school/10132939");
    // Residuals should have + or - prefix
    const hasSignedValue =
      html.includes("+") || html.includes("text-red-600") || html.includes("text-green-600");
    assert.ok(hasSignedValue, "Should display color-coded residual values");
  });

  it("should show year range spanning multiple decades", async () => {
    const { html } = await fetchPage("/trends");
    assertContains(html, "1998", "Should contain start year");
    assertContains(html, "202", "Should contain recent year (202x)");
  });

  it("dashboard stats should have non-zero values", async () => {
    const { html } = await fetchPage("/");
    // The stats cards should NOT show "0" as the count
    // Find the stats section and verify real numbers
    const schoolCountMatch = html.match(
      /Schools<\/p>.*?<div[^>]*>(\d[\d,]*)<\/div>/s
    );
    if (schoolCountMatch) {
      const count = parseInt(schoolCountMatch[1].replace(/,/g, ""));
      assert.ok(count > 0, `School count should be > 0, got ${count}`);
    }
  });
});

// ============================================================
// PERFORMANCE & RESPONSE QUALITY
// ============================================================
describe("Response quality", () => {
  it("should serve pages with Content-Type text/html", async () => {
    const { headers } = await fetchPage("/");
    const ct = headers.get("content-type") || "";
    assert.ok(ct.includes("text/html"), `Content-Type should be text/html, got ${ct}`);
  });

  it("should serve pages within reasonable time", async () => {
    const start = Date.now();
    await fetchPage("/");
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 5000, `Dashboard should load within 5s, took ${elapsed}ms`);
  });

  it("should handle concurrent requests", async () => {
    const pages = ["/", "/municipalities", "/search?q=test", "/trends"];
    const results = await Promise.all(pages.map(fetchPage));
    for (const r of results) {
      assert.equal(r.status, 200);
      assert.ok(r.html.length > 100);
    }
  });

  it("pages should have reasonable HTML size", async () => {
    const { html } = await fetchPage("/");
    assert.ok(
      html.length > 1000,
      `Dashboard HTML too small: ${html.length} bytes`
    );
    assert.ok(
      html.length < 5_000_000,
      `Dashboard HTML too large: ${html.length} bytes`
    );
  });
});

// ============================================================
// EDGE CASES & ERROR HANDLING
// ============================================================
describe("Edge cases", () => {
  it("should handle special characters in search", async () => {
    const { status } = await fetchPage(
      "/search?q=" + encodeURIComponent("Jönköping")
    );
    assert.equal(status, 200);
  });

  it("should handle empty compare schools param", async () => {
    const { status } = await fetchPage("/compare?schools=");
    assert.equal(status, 200);
  });

  it("should handle very long search query", async () => {
    const longQuery = "a".repeat(200);
    const { status } = await fetchPage(`/search?q=${longQuery}`);
    assert.equal(status, 200);
  });

  it("should handle invalid school code format", async () => {
    const { status, html } = await fetchPage("/school/abc-def-123");
    assert.equal(status, 200);
    assertContains(html, "not found");
  });

  it("should handle duplicate school codes in compare", async () => {
    const { status } = await fetchPage(
      "/compare?schools=10132939,10132939,10132939"
    );
    assert.equal(status, 200);
  });
});
