import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CompareBuilder } from "@/components/compare-builder";
import { getSchool } from "@/lib/db";
import { getLangFromCookie, t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);
  const title = t("meta.compare.title", lang);
  const description = t("meta.compare.description", lang);
  return {
    title,
    description,
    alternates: { canonical: "/compare" },
    openGraph: { title, description, url: "https://skolsalsa.se/compare", type: "website", siteName: "SkolSalsa" },
    twitter: { card: "summary", title, description },
  };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ schools?: string }>;
}) {
  const { schools: schoolsParam } = await searchParams;
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);

  const codes = schoolsParam
    ? schoolsParam.split(",").filter((s) => /^\d{5,}$/.test(s)).slice(0, 5)
    : [];

  // Resolve initial school names from codes (for URL-shared links)
  const initialSchools = codes
    .map((code) => {
      try {
        const s = getSchool(code);
        return s
          ? { code: s.school_code, name: s.name, municipality: s.municipality_name }
          : null;
      } catch {
        return null;
      }
    })
    .filter((s): s is { code: string; name: string; municipality: string } => s !== null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("compare.title", lang)}</h1>
        <p className="text-muted-foreground">
          {t("compare.subtitle", lang)}
        </p>
      </div>
      <CompareBuilder initialSchools={initialSchools} lang={lang} />
    </div>
  );
}
