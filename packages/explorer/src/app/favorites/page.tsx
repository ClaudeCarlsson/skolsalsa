import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getLangFromCookie, t } from "@/lib/i18n";
import { FavoritesClient } from "./favorites-client";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);
  const title = t("meta.favorites.title", lang);
  const description = t("meta.favorites.description", lang);
  return {
    title,
    description,
    openGraph: { title, description, url: "https://skolsalsa.se/favorites", type: "website", siteName: "SkolSalsa" },
  };
}

export default async function FavoritesPage() {
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">{t("favorites.title", lang)}</h1>
      <FavoritesClient lang={lang} />
    </div>
  );
}
