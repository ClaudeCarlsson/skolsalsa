"use client";

import { NationalTrendChart } from "@/components/charts";
import type { Lang } from "@/lib/i18n";

export function TrendChartClient({
  data,
  lang,
}: {
  data: Array<{
    year: number;
    avg_merit: number;
    avg_eligible: number;
    school_count: number;
  }>;
  lang: Lang;
}) {
  return <NationalTrendChart data={data} lang={lang} />;
}
