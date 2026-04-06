import { NextRequest, NextResponse } from "next/server";
import { compareSchools } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/log";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { ok, remaining } = checkRateLimit(ip);

  if (!ok) {
    log("warn", "Rate limit exceeded", { ip, path: "/api/compare" });
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" },
      }
    );
  }

  const schoolsParam = request.nextUrl.searchParams.get("schools") || "";
  const codes = schoolsParam
    .split(",")
    .filter((s) => /^\d{5,}$/.test(s))
    .slice(0, 5);

  if (codes.length === 0) {
    return NextResponse.json([], {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  }

  try {
    const results = compareSchools(codes);
    log("info", "Compare", { codes, results: results.length, ip });
    return NextResponse.json(results, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (err) {
    log("error", "Compare failed", {
      codes,
      error: err instanceof Error ? err.message : "Unknown",
      ip,
    });
    return NextResponse.json([], { status: 500 });
  }
}
