import { NextRequest, NextResponse } from "next/server";
import { searchSchools } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/log";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { ok, remaining } = checkRateLimit(ip);

  if (!ok) {
    log("warn", "Rate limit exceeded", { ip, path: "/api/search" });
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" },
      }
    );
  }

  const q = request.nextUrl.searchParams.get("q") || "";
  if (q.length < 2) {
    return NextResponse.json([], {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  }

  try {
    const results = searchSchools(q.slice(0, 100), 20);
    log("info", "Search", { q: q.slice(0, 50), results: results.length, ip });
    return NextResponse.json(results, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (err) {
    log("error", "Search failed", {
      q: q.slice(0, 50),
      error: err instanceof Error ? err.message : "Unknown",
      ip,
    });
    return NextResponse.json([], { status: 500 });
  }
}
