import Link from "next/link";
import type { Metadata } from "next";
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
  getTopBottomSchoolsFiltered,
  getYearDistributionFiltered,
  getMunicipalityRanking,
} from "@/lib/db";
import { getLangFromCookie, t, tf } from "@/lib/i18n";
import { DashboardFilter } from "@/components/dashboard-filter";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);
  const title = t("meta.home.title", lang);
  const description = t("meta.home.description", lang);
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description, url: "https://skolsalsa.se", type: "website", siteName: "SkolSalsa" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Dashboard() {
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);

  let stats: ReturnType<typeof getDashboardStats> = undefined as unknown as ReturnType<typeof getDashboardStats>;
  let trendsAll: ReturnType<typeof getNationalTrends> = [];
  let trendsMunicipal: ReturnType<typeof getNationalTrends> = [];
  let trendsIndependent: ReturnType<typeof getNationalTrends> = [];
  let distributionAll: ReturnType<typeof getYearDistributionFiltered> = null;
  let distributionMunicipal: ReturnType<typeof getYearDistributionFiltered> = null;
  let distributionIndependent: ReturnType<typeof getYearDistributionFiltered> = null;
  let topBottomAll: ReturnType<typeof getTopBottomSchoolsFiltered> = { top: [], bottom: [] };
  let topBottomMunicipal: ReturnType<typeof getTopBottomSchoolsFiltered> = { top: [], bottom: [] };
  let topBottomIndependent: ReturnType<typeof getTopBottomSchoolsFiltered> = { top: [], bottom: [] };
  let muniRankingAll: ReturnType<typeof getMunicipalityRanking> = [];
  let muniRankingMunicipal: ReturnType<typeof getMunicipalityRanking> = [];
  let muniRankingIndependent: ReturnType<typeof getMunicipalityRanking> = [];

  try {
    stats = getDashboardStats();
    trendsAll = getNationalTrends("all");
    trendsMunicipal = getNationalTrends("municipal");
    trendsIndependent = getNationalTrends("independent");
    distributionAll = getYearDistributionFiltered(stats.max_year, "all");
    distributionMunicipal = getYearDistributionFiltered(stats.max_year, "municipal");
    distributionIndependent = getYearDistributionFiltered(stats.max_year, "independent");
    topBottomAll = getTopBottomSchoolsFiltered(stats.max_year, 10, "all");
    topBottomMunicipal = getTopBottomSchoolsFiltered(stats.max_year, 10, "municipal");
    topBottomIndependent = getTopBottomSchoolsFiltered(stats.max_year, 10, "independent");
    muniRankingAll = getMunicipalityRanking(stats.max_year, "all");
    muniRankingMunicipal = getMunicipalityRanking(stats.max_year, "municipal");
    muniRankingIndependent = getMunicipalityRanking(stats.max_year, "independent");
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

      <DashboardFilter
        lang={lang}
        year={stats.max_year}
        trends={{
          all: trendsAll,
          municipal: trendsMunicipal,
          independent: trendsIndependent,
        }}
        distributions={{
          all: distributionAll ?? null,
          municipal: distributionMunicipal ?? null,
          independent: distributionIndependent ?? null,
        }}
        topBottoms={{
          all: topBottomAll ?? { top: [], bottom: [] },
          municipal: topBottomMunicipal ?? { top: [], bottom: [] },
          independent: topBottomIndependent ?? { top: [], bottom: [] },
        }}
        muniRankings={{
          all: muniRankingAll ?? [],
          municipal: muniRankingMunicipal ?? [],
          independent: muniRankingIndependent ?? [],
        }}
      />

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
