"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendChartClient } from "./trend-chart-client";
import { ResidualBadge } from "./residual-badge";
import { t, tf, type Lang } from "@/lib/i18n";
import type { DistributionStats, NationalTrend, SalsaResult } from "@/lib/db";

type FilterType = "all" | "municipal" | "independent";

interface Props {
  lang: Lang;
  year: number;
  trends: NationalTrend[];
  distributions: Record<FilterType, DistributionStats | null>;
  topBottoms: Record<FilterType, { top: SalsaResult[]; bottom: SalsaResult[] }>;
  muniRankings: Record<FilterType, Array<{
    code: string;
    name: string;
    avg_merit: number;
    avg_residual: number;
    avg_eligible: number;
    school_count: number;
  }>>;
}

export function DashboardFilter({
  lang,
  year,
  trends,
  distributions,
  topBottoms,
  muniRankings,
}: Props) {
  const [filter, setFilter] = useState<FilterType>("all");

  const distribution = distributions[filter];
  const topBottom = topBottoms[filter];
  const muniRanking = muniRankings[filter];

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: t("filter.all", lang) },
    { key: "municipal", label: t("filter.municipal", lang) },
    { key: "independent", label: t("filter.independent", lang) },
  ];

  return (
    <>
      {/* Filter toggle */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-all ${
              filter === f.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Key insights for latest year */}
      {distribution && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.keyInsights", lang)} ({year})</CardTitle>
            <CardDescription>
              {tf("dashboard.snapshot", lang, { count: distribution.total_count })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">{t("dashboard.avgMerit", lang)}</div>
                <div className="text-xl font-bold tabular-nums">{distribution.avg_merit}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t("dashboard.meritRange", lang)}</div>
                <div className="text-xl font-bold tabular-nums">
                  {distribution.min_merit}&ndash;{distribution.max_merit}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t("dashboard.abovePrediction", lang)}</div>
                <div className="text-xl font-bold tabular-nums text-emerald-600">
                  {distribution.positive_residual_count} {t("dashboard.schoolsWord", lang)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t("dashboard.belowPrediction", lang)}</div>
                <div className="text-xl font-bold tabular-nums text-red-600">
                  {distribution.negative_residual_count} {t("dashboard.schoolsWord", lang)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* National trend chart */}
      {trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.nationalTrends", lang)}</CardTitle>
            <CardDescription>{t("dashboard.nationalTrendsDesc", lang)}</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChartClient data={trends} lang={lang} />
          </CardContent>
        </Card>
      )}

      {/* Top and bottom schools */}
      {topBottom && (topBottom.top.length > 0 || topBottom.bottom.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-emerald-600">
                {t("dashboard.topOutperformers", lang)} ({year})
              </CardTitle>
              <CardDescription>{t("dashboard.topOutperformersDesc", lang)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topBottom.top.map((s, i) => (
                  <div key={s.school_code} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <Link
                      href={`/school/${s.school_code}`}
                      className="text-primary hover:underline flex-1 truncate"
                    >
                      {s.school_name}
                    </Link>
                    <span className="text-muted-foreground text-xs truncate max-w-24">
                      {s.municipality_name}
                    </span>
                    <ResidualBadge value={s.residual_merit} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-600">
                {t("dashboard.bottomUnderperformers", lang)} ({year})
              </CardTitle>
              <CardDescription>{t("dashboard.bottomUnderperformersDesc", lang)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topBottom.bottom.map((s, i) => (
                  <div key={s.school_code} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <Link
                      href={`/school/${s.school_code}`}
                      className="text-primary hover:underline flex-1 truncate"
                    >
                      {s.school_name}
                    </Link>
                    <span className="text-muted-foreground text-xs truncate max-w-24">
                      {s.municipality_name}
                    </span>
                    <ResidualBadge value={s.residual_merit} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Municipality ranking */}
      {muniRanking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.muniRanking", lang)} ({year})</CardTitle>
            <CardDescription>{t("dashboard.muniRankingDesc", lang)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th scope="col" className="text-left py-2 px-3">#</th>
                    <th scope="col" className="text-left py-2 px-3">{t("common.municipality", lang)}</th>
                    <th scope="col" className="text-right py-2 px-3">{t("common.schools", lang)}</th>
                    <th scope="col" className="text-right py-2 px-3">{t("common.avgMerit", lang)}</th>
                    <th scope="col" className="text-right py-2 px-3">{t("common.avgResidual", lang)}</th>
                    <th scope="col" className="text-right py-2 px-3">{t("common.eligible", lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {muniRanking.slice(0, 20).map((m, i) => (
                    <tr key={m.code} className="border-b last:border-0 hover:bg-accent/50">
                      <td className="py-1.5 px-3 text-muted-foreground">{i + 1}</td>
                      <td className="py-1.5 px-3">
                        <Link href={`/municipality/${m.code}`} className="text-primary hover:underline">
                          {m.name}
                        </Link>
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-muted-foreground">{m.school_count}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums font-medium">{m.avg_merit}</td>
                      <td className="py-1.5 px-3 text-right">
                        <ResidualBadge value={m.avg_residual} />
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums">{m.avg_eligible}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
