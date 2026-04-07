import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getNationalTrends } from "@/lib/db";
import { TrendsCharts } from "./trends-charts";
import { getLangFromCookie, t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);
  const title = t("meta.trends.title", lang);
  const description = t("meta.trends.description", lang);
  return {
    title,
    description,
    alternates: { canonical: "/trends" },
    openGraph: { title, description, url: "https://skolsalsa.se/trends", type: "website", siteName: "SkolSalsa" },
    twitter: { card: "summary", title, description },
  };
}

export default async function TrendsPage() {
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);

  let trends;
  try {
    trends = getNationalTrends();
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("trends.title", lang)}</h1>
        <p className="text-muted-foreground">{t("trends.couldNotLoad", lang)}</p>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("trends.title", lang)}</h1>
        <p className="text-muted-foreground">
          {t("trends.noData", lang)}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">{t("trends.title", lang)}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("trends.avgMerit", lang)}
            </CardTitle>
            <CardDescription>
              {t("trends.avgMeritDesc", lang)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendsCharts type="merit" data={trends} lang={lang} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("trends.schoolCount", lang)}</CardTitle>
            <CardDescription>
              {t("trends.schoolCountDesc", lang)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendsCharts type="count" data={trends} lang={lang} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("trends.yearlyData", lang)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 px-3">{t("common.year", lang)}</th>
                  <th className="text-right py-2 px-3">{t("common.avgMerit", lang)}</th>
                  <th className="text-right py-2 px-3">{t("common.avgResidual", lang)}</th>
                  <th className="text-right py-2 px-3">{t("common.avgEligible", lang)}</th>
                  <th className="text-right py-2 px-3">{t("common.schools", lang)}</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((tr) => (
                  <tr
                    key={tr.year}
                    className="border-b last:border-0 hover:bg-accent/50"
                  >
                    <td className="py-1.5 px-3 font-medium">{tr.year}</td>
                    <td className="py-1.5 px-3 text-right tabular-nums">
                      {tr.avg_merit}
                    </td>
                    <td className="py-1.5 px-3 text-right tabular-nums">
                      {tr.avg_residual}
                    </td>
                    <td className="py-1.5 px-3 text-right tabular-nums">
                      {tr.avg_eligible}%
                    </td>
                    <td className="py-1.5 px-3 text-right tabular-nums text-muted-foreground">
                      {tr.school_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
