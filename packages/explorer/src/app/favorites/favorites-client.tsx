"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getFavorites, setFavorites } from "@/components/favorite-button";
import { ResidualBadge } from "@/components/residual-badge";
import { t, type Lang } from "@/lib/i18n";
import type { SchoolSummary } from "@/lib/db";

async function fetchSchoolData(codes: string[]): Promise<SchoolSummary[]> {
  if (codes.length === 0) return [];
  const results = await Promise.all(
    codes.map((code) =>
      fetch(`/api/search?q=${code}`)
        .then((r) => r.json())
        .then((data: SchoolSummary[]) => data.find((s) => s.school_code === code) ?? null)
        .catch(() => null)
    )
  );
  return results.filter((s): s is SchoolSummary => s !== null);
}

interface State {
  codes: string[];
  schools: SchoolSummary[] | null;
}

export function FavoritesClient({ lang }: { lang: Lang }) {
  const [state, setState] = useState<State>({ codes: [], schools: null });

  useEffect(() => {
    const codes = getFavorites();
    // Fetch data and set state in the async callback (not synchronously in effect body)
    fetchSchoolData(codes).then((schools) => {
      setState({ codes, schools });
    });
  }, []);

  const removeFavorite = useCallback((code: string) => {
    setState((prev) => {
      const updated = prev.codes.filter((c) => c !== code);
      setFavorites(updated);
      return {
        codes: updated,
        schools: prev.schools?.filter((s) => s.school_code !== code) ?? [],
      };
    });
  }, []);

  if (state.schools === null) {
    return <p className="text-sm text-muted-foreground animate-pulse">{t("compare.loading", lang)}</p>;
  }

  if (state.codes.length === 0) {
    return <p className="text-muted-foreground">{t("favorites.empty", lang)}</p>;
  }

  return (
    <div className="space-y-4">
      {state.schools.length > 1 && (
        <Link
          href={`/compare?schools=${state.codes.join(",")}`}
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          {t("favorites.compareAll", lang)} ({state.codes.length})
        </Link>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th scope="col" className="text-left py-2 px-3">{t("common.school", lang)}</th>
              <th scope="col" className="text-left py-2 px-3">{t("common.municipality", lang)}</th>
              <th scope="col" className="text-right py-2 px-3">{t("common.merit", lang)}</th>
              <th scope="col" className="text-right py-2 px-3">{t("common.residual", lang)}</th>
              <th scope="col" className="text-right py-2 px-3" />
            </tr>
          </thead>
          <tbody>
            {state.schools.map((s) => (
              <tr key={s.school_code} className="border-b last:border-0 hover:bg-accent/50">
                <td className="py-2 px-3">
                  <Link href={`/school/${s.school_code}`} className="text-primary hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="py-2 px-3 text-muted-foreground">{s.municipality_name}</td>
                <td className="py-2 px-3 text-right tabular-nums">{s.latest_merit ?? "\u2013"}</td>
                <td className="py-2 px-3 text-right">
                  <ResidualBadge value={s.latest_residual} />
                </td>
                <td className="py-2 px-3 text-right">
                  <button
                    onClick={() => removeFavorite(s.school_code)}
                    className="text-xs text-muted-foreground hover:text-red-600 transition"
                  >
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
