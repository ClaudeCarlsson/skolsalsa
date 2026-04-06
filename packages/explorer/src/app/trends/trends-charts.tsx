"use client";

import { NationalTrendChart, SchoolCountChart } from "@/components/charts";
import type { NationalTrend } from "@/lib/db";
import type { Lang } from "@/lib/i18n";

export function TrendsCharts({
  type,
  data,
  lang,
}: {
  type: "merit" | "count";
  data: NationalTrend[];
  lang: Lang;
}) {
  if (type === "merit") {
    return <NationalTrendChart data={data} lang={lang} />;
  }
  return <SchoolCountChart data={data} lang={lang} />;
}
