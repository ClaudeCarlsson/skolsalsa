import Link from "next/link";
import { cookies } from "next/headers";
import { Card, CardContent } from "@/components/ui/card";
import { getMunicipalities } from "@/lib/db";
import { getLangFromCookie, t } from "@/lib/i18n";

export default async function MunicipalitiesPage() {
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);

  let municipalities;
  try {
    municipalities = getMunicipalities();
  } catch {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("muni.title", lang)}</h1>
        <p className="text-muted-foreground">
          {t("muni.couldNotLoad", lang)}
        </p>
      </div>
    );
  }

  if (municipalities.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("muni.title", lang)}</h1>
        <p className="text-muted-foreground">
          {t("muni.noMunicipalities", lang)}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {t("muni.title", lang)} ({municipalities.length})
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {municipalities.map((m) => (
          <Link key={m.code} href={`/municipality/${m.code}`}>
            <Card className="hover:bg-accent transition cursor-pointer h-full">
              <CardContent className="py-3 px-4">
                <div className="font-medium text-sm">{m.name}</div>
                <div className="text-xs text-muted-foreground">
                  {m.school_count} {t("muni.skolor", lang)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
