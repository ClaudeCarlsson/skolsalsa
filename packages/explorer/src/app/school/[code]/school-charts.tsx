"use client";

import {
  MeritTrendChart,
  ResidualChart,
  BackgroundChart,
  EligibilityChart,
} from "@/components/charts";
import type { SalsaResult } from "@/lib/db";
import type { Lang } from "@/lib/i18n";

export function SchoolCharts({
  type,
  data,
  lang,
}: {
  type: "merit" | "residual" | "background" | "eligibility";
  data: SalsaResult[];
  lang: Lang;
}) {
  switch (type) {
    case "merit":
      return <MeritTrendChart data={data} lang={lang} />;
    case "residual":
      return <ResidualChart data={data} lang={lang} />;
    case "background":
      return <BackgroundChart data={data} lang={lang} />;
    case "eligibility":
      return <EligibilityChart data={data} lang={lang} />;
  }
}
