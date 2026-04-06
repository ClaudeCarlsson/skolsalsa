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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getSchool, getSchoolResults } from "@/lib/db";
import { SchoolCharts } from "./school-charts";
import { CsvExport } from "@/components/csv-export";
import { FavoriteButton } from "@/components/favorite-button";
import { getLangFromCookie, t, tf } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);
  try {
    const school = getSchool(code);
    const results = getSchoolResults(code);
    if (!school) return { title: t("school.notFound", lang) };
    const latest = results.length > 0 ? results[results.length - 1] : null;
    const title = tf("meta.school.title", lang, {
      name: school.name,
      municipality: school.municipality_name,
    });
    const description = tf("meta.school.description", lang, {
      name: school.name,
      municipality: school.municipality_name,
      merit: latest?.avg_merit_value ?? "\u2013",
      residual: latest?.residual_merit ?? "\u2013",
    });
    return {
      title,
      description,
      openGraph: { title, description, url: `https://skolsalsa.se/school/${code}`, type: "website", siteName: "SkolSalsa" },
    };
  } catch {
    return { title: "SkolSalsa" };
  }
}

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);

  // Validate param format (school codes are 8+ digit numbers)
  if (!/^\d{5,}$/.test(code)) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">{t("school.notFound", lang)}</h1>
        <p className="text-muted-foreground mt-2">{t("error.invalidCode", lang)}</p>
      </div>
    );
  }

  let school;
  let results;
  try {
    school = getSchool(code);
    results = getSchoolResults(code);
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">{t("error.title", lang)}</h1>
        <p className="text-muted-foreground mt-2">{t("error.couldNotLoad", lang)}</p>
      </div>
    );
  }

  if (!school && results.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">{t("school.notFound", lang)}</h1>
        <p className="text-muted-foreground mt-2">
          {t("school.noData", lang)}
        </p>
      </div>
    );
  }

  const name = school?.name || results[0]?.school_name || "Unknown";
  const municipality = school?.municipality_name || results[0]?.municipality_name;
  const latest = results.length > 0 ? results[results.length - 1] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div>
        {municipality && (
          <Link
            href={`/municipality/${school?.municipality_code || ""}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; {municipality}
          </Link>
        )}
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold">{name}</h1>
          <FavoriteButton schoolCode={code} lang={lang} />
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {municipality && (
            <span className="text-muted-foreground">{municipality}</span>
          )}
          <Badge variant={school?.is_public === 1 ? "secondary" : "outline"}>
            {school?.is_public === 1 ? t("common.kommunal", lang) : t("common.enskild", lang)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {results.length} {t("school.yearsOfData", lang)}
          </span>
        </div>
      </div>

      {/* Latest stats */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-1">
              <CardDescription>{t("school.latestMerit", lang)} ({latest.year})</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {latest.avg_merit_value ?? "\u2013"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardDescription>{t("common.predicted", lang)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {latest.predicted_merit_value ?? "\u2013"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardDescription>{t("common.residual", lang)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold tabular-nums ${
                  latest.residual_merit !== null
                    ? latest.residual_merit > 0
                      ? "text-green-600"
                      : latest.residual_merit < 0
                      ? "text-red-600"
                      : ""
                    : ""
                }`}
              >
                {latest.residual_merit !== null
                  ? (latest.residual_merit > 0 ? "+" : "") +
                    latest.residual_merit
                  : "\u2013"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardDescription>{t("common.eligible", lang)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {latest.pct_eligible_gymnasiet !== null
                  ? `${latest.pct_eligible_gymnasiet}%`
                  : "\u2013"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardDescription>{t("common.parentsEd", lang)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {latest.pct_parents_higher_ed ?? "\u2013"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Residual explanation */}
      {latest?.residual_merit !== null && latest?.residual_merit !== undefined && (
        <p className="text-sm text-muted-foreground -mt-2">
          {latest.residual_merit > 0
            ? tf("school.residualExplainPositive", lang, { value: latest.residual_merit })
            : latest.residual_merit < 0
            ? tf("school.residualExplainNegative", lang, { value: Math.abs(latest.residual_merit) })
            : t("school.residualExplainZero", lang)}
        </p>
      )}

      {/* Charts */}
      {results.length > 1 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("school.meritTrend", lang)}</CardTitle>
                <CardDescription>
                  {t("school.meritTrendDesc", lang)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SchoolCharts type="merit" data={results} lang={lang} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("school.residualOverTime", lang)}</CardTitle>
                <CardDescription>
                  {t("school.residualOverTimeDesc", lang)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SchoolCharts type="residual" data={results} lang={lang} />
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("school.eligibility", lang)}</CardTitle>
                <CardDescription>
                  {t("school.eligibilityDesc", lang)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SchoolCharts type="eligibility" data={results} lang={lang} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("school.demographics", lang)}</CardTitle>
                <CardDescription>
                  {t("school.demographicsDesc", lang)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SchoolCharts type="background" data={results} lang={lang} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Separator />

      {/* Data table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t("school.allData", lang)}</CardTitle>
          <CsvExport
            filename={`${name.replace(/[^a-zA-ZåäöÅÄÖ0-9]/g, "_")}_salsa.csv`}
            headers={[t("common.year", lang), t("common.parentsEd", lang), t("common.newlyArrived", lang), t("common.foreignBg", lang), t("common.boys", lang), t("common.eligible", lang), t("common.predElig", lang), t("common.resElig", lang), t("common.merit", lang), t("common.predMerit", lang), t("common.resMerit", lang)]}
            rows={results.map((r) => [
              r.year,
              r.pct_parents_higher_ed,
              r.pct_newly_arrived,
              r.pct_foreign_background,
              r.pct_boys,
              r.pct_eligible_gymnasiet,
              r.predicted_eligible,
              r.residual_eligible,
              r.avg_merit_value,
              r.predicted_merit_value,
              r.residual_merit,
            ])}
            lang={lang}
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left py-2 px-2">{t("common.year", lang)}</th>
                  <th className="text-right py-2 px-2">{t("common.parentsEd", lang)}</th>
                  <th className="text-right py-2 px-2">{t("common.newlyArrived", lang)}</th>
                  <th className="text-right py-2 px-2">{t("common.foreignBg", lang)}</th>
                  <th className="text-right py-2 px-2">{t("common.boys", lang)}</th>
                  <th className="text-right py-2 px-2">{t("common.eligible", lang)}</th>
                  <th className="text-right py-2 px-2">{t("common.predElig", lang)}</th>
                  <th className="text-right py-2 px-2">{t("common.resElig", lang)}</th>
                  <th className="text-right py-2 px-2">{t("common.merit", lang)}</th>
                  <th className="text-right py-2 px-2">{t("common.predMerit", lang)}</th>
                  <th className="text-right py-2 px-2 font-semibold">{t("common.resMerit", lang)}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.year}
                    className="border-b last:border-0 hover:bg-accent/50"
                  >
                    <td className="py-1.5 px-2 font-medium">{r.year}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {r.pct_parents_higher_ed ?? "\u2013"}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {r.pct_newly_arrived ?? "\u2013"}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {r.pct_foreign_background ?? "\u2013"}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {r.pct_boys ?? "\u2013"}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {r.pct_eligible_gymnasiet ?? "\u2013"}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {r.predicted_eligible ?? "\u2013"}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {r.residual_eligible ?? "\u2013"}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {r.avg_merit_value ?? "\u2013"}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {r.predicted_merit_value ?? "\u2013"}
                    </td>
                    <td
                      className={`py-1.5 px-2 text-right tabular-nums font-medium ${
                        r.residual_merit !== null
                          ? r.residual_merit > 0
                            ? "text-green-600"
                            : r.residual_merit < 0
                            ? "text-red-600"
                            : ""
                          : ""
                      }`}
                    >
                      {r.residual_merit !== null
                        ? (r.residual_merit > 0 ? "+" : "") + r.residual_merit
                        : "\u2013"}
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
