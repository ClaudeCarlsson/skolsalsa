import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LiveSearch } from "@/components/live-search";
import { getLangFromCookie, t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);
  const title = t("meta.search.title", lang);
  const description = t("meta.search.description", lang);
  return {
    title,
    description,
    alternates: { canonical: "/search" },
    openGraph: { title, description, url: "https://skolsalsa.se/search", type: "website", siteName: "SkolSalsa" },
    twitter: { card: "summary", title, description },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q || "").slice(0, 100);
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">{t("search.title", lang)}</h1>
      <LiveSearch initialQuery={query} lang={lang} />
    </div>
  );
}
