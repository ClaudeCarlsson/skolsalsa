import Link from "next/link";
import { cookies } from "next/headers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getSchoolsByMunicipality,
  getMunicipalityStats,
} from "@/lib/db";
import { TrendChartClient } from "@/components/trend-chart-client";
import { ResidualBadge } from "@/components/residual-badge";
import { getLangFromCookie, t } from "@/lib/i18n";

export default async function MunicipalityPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);

  // Validate param format (municipality codes are 4 digits)
  if (!/^\d{4}$/.test(code)) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("muni.notFound", lang)}</h1>
        <p className="text-muted-foreground">{t("error.invalidCode", lang)}</p>
      </div>
    );
  }

  let schools;
  let stats;
  try {
    schools = getSchoolsByMunicipality(code);
    stats = getMunicipalityStats(code);
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("error.title", lang)}</h1>
        <p className="text-muted-foreground">{t("error.couldNotLoad", lang)}</p>
      </div>
    );
  }

  if (schools.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("muni.notFound", lang)}</h1>
        <p className="text-muted-foreground">{t("muni.noSchools", lang)}</p>
      </div>
    );
  }

  const municipalityName = schools[0].municipality_name;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div>
        <Link
          href="/municipalities"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; {t("muni.allMunicipalities", lang)}
        </Link>
        <h1 className="text-2xl font-bold mt-2">{municipalityName}</h1>
        <p className="text-muted-foreground">
          {schools.length} {t("muni.schoolsWithData", lang)}
        </p>
      </div>

      {stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("muni.trends", lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChartClient data={stats} lang={lang} />
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-2 px-3">{t("common.school", lang)}</th>
              <th className="text-left py-2 px-3">{t("common.type", lang)}</th>
              <th className="text-right py-2 px-3">{t("common.latestYear", lang)}</th>
              <th className="text-right py-2 px-3">{t("common.merit", lang)}</th>
              <th className="text-right py-2 px-3">{t("common.residual", lang)}</th>
              <th className="text-right py-2 px-3">{t("common.eligible", lang)}</th>
              <th className="text-right py-2 px-3">{t("common.years", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.school_code} className="border-b last:border-0 hover:bg-accent/50">
                <td className="py-2 px-3">
                  <Link
                    href={`/school/${s.school_code}`}
                    className="text-primary hover:underline"
                  >
                    {s.name}
                  </Link>
                </td>
                <td className="py-2 px-3">
                  <Badge variant={s.is_public ? "secondary" : "outline"}>
                    {s.is_public ? t("common.kommunal", lang) : t("common.enskild", lang)}
                  </Badge>
                </td>
                <td className="py-2 px-3 text-right tabular-nums">
                  {s.latest_year || "\u2013"}
                </td>
                <td className="py-2 px-3 text-right tabular-nums">
                  {s.latest_merit ?? "\u2013"}
                </td>
                <td className="py-2 px-3 text-right">
                  <ResidualBadge value={s.latest_residual} />
                </td>
                <td className="py-2 px-3 text-right tabular-nums">
                  {s.latest_eligible !== null ? `${s.latest_eligible}%` : "\u2013"}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                  {s.year_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
