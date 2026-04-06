import Link from "next/link";
import { cookies } from "next/headers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getDashboardStats,
  getNationalTrends,
  getTopBottomSchools,
  getYearDistribution,
  getMunicipalityRanking,
} from "@/lib/db";
import { getLangFromCookie, t, tf } from "@/lib/i18n";
import { TrendChartClient } from "@/components/trend-chart-client";
import { ResidualBadge } from "@/components/residual-badge";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);

  let stats, trends, topBottom, distribution, muniRanking;

  try {
    stats = getDashboardStats();
    trends = getNationalTrends();
    topBottom = getTopBottomSchools(stats.max_year, 10);
    distribution = getYearDistribution(stats.max_year);
    muniRanking = getMunicipalityRanking(stats.max_year);
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">{t("meta.title", lang)}</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="mb-2">{t("error.dbMissing", lang)}</p>
            <p className="text-sm">
              {t("error.runScraper", lang)}{" "}
              <code className="bg-muted px-2 py-1 rounded">npm run scrape</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.title", lang)}</h1>
        <p className="text-muted-foreground mt-1">
          {t("dashboard.subtitle", lang)} &mdash; {stats.min_year}&ndash;
          {stats.max_year}
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.schools", lang)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_schools.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.municipalities", lang)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_municipalities}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.dataPoints", lang)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_records.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.yearsCovered", lang)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.max_year - stats.min_year + 1}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key insights for latest year */}
      {distribution && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.keyInsights", lang)} ({stats.max_year})</CardTitle>
            <CardDescription>
              {tf("dashboard.snapshot", lang, { count: distribution.total_count })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">{t("dashboard.avgMerit", lang)}</div>
                <div className="text-xl font-bold tabular-nums">
                  {distribution.avg_merit}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  {t("dashboard.meritRange", lang)}
                </div>
                <div className="text-xl font-bold tabular-nums">
                  {distribution.min_merit}&ndash;{distribution.max_merit}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  {t("dashboard.abovePrediction", lang)}
                </div>
                <div className="text-xl font-bold tabular-nums text-green-600">
                  {distribution.positive_residual_count} {t("dashboard.schoolsWord", lang)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  {t("dashboard.belowPrediction", lang)}
                </div>
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
            <CardDescription>
              {t("dashboard.nationalTrendsDesc", lang)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChartClient data={trends} lang={lang} />
          </CardContent>
        </Card>
      )}

      {/* Top and bottom schools side by side */}
      {topBottom && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-600">
                {t("dashboard.topOutperformers", lang)} ({stats.max_year})
              </CardTitle>
              <CardDescription>
                {t("dashboard.topOutperformersDesc", lang)}
              </CardDescription>
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
                {t("dashboard.bottomUnderperformers", lang)} ({stats.max_year})
              </CardTitle>
              <CardDescription>
                {t("dashboard.bottomUnderperformersDesc", lang)}
              </CardDescription>
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
      {muniRanking && muniRanking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.muniRanking", lang)} ({stats.max_year})</CardTitle>
            <CardDescription>
              {t("dashboard.muniRankingDesc", lang)}
            </CardDescription>
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
                        <Link
                          href={`/municipality/${m.code}`}
                          className="text-primary hover:underline"
                        >
                          {m.name}
                        </Link>
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-muted-foreground">
                        {m.school_count}
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums font-medium">
                        {m.avg_merit}
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <ResidualBadge value={m.avg_residual} />
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums">
                        {m.avg_eligible}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/municipalities">
          <Card className="hover:bg-accent transition cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.browseByMuni", lang)}</CardTitle>
              <CardDescription>
                {tf("dashboard.browseByMuniDesc", lang, { count: stats.total_municipalities })}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/search">
          <Card className="hover:bg-accent transition cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.searchSchools", lang)}</CardTitle>
              <CardDescription>
                {t("dashboard.searchSchoolsDesc", lang)}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/compare">
          <Card className="hover:bg-accent transition cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.compareSchools", lang)}</CardTitle>
              <CardDescription>
                {t("dashboard.compareSchoolsDesc", lang)}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
