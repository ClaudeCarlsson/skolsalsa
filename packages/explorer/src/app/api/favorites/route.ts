import { NextRequest, NextResponse } from "next/server";
import { getSchoolSummaries } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { ok, remaining } = checkRateLimit(ip);

  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" } }
    );
  }

  const codes = (request.nextUrl.searchParams.get("codes") || "")
    .split(",")
    .filter((c) => /^\d{5,}$/.test(c))
    .slice(0, 50);

  if (codes.length === 0) {
    return NextResponse.json([], {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  }

  try {
    const results = getSchoolSummaries(codes);
    return NextResponse.json(results, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
