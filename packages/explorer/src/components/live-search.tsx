"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ResidualBadge } from "@/components/residual-badge";
import { t, type Lang } from "@/lib/i18n";
import type { SchoolSummary } from "@/lib/db";

export function LiveSearch({ initialQuery = "", lang }: { initialQuery?: string; lang: Lang }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SchoolSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const resp = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await resp.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load if query exists
  useEffect(() => {
    if (initialQuery.length >= 2) {
      doSearch(initialQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(value);
      // Update URL without reload
      const url = value ? `/search?q=${encodeURIComponent(value)}` : "/search";
      window.history.replaceState(null, "", url);
    }, 250);
  };

  return (
    <div className="space-y-6">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t("search.placeholder", lang)}
        aria-label={t("search.ariaLabel", lang)}
        className="w-full max-w-xl px-4 py-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring text-base"
        autoFocus
      />

      {loading && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {t("search.searching", lang)}
        </p>
      )}

      {searched && !loading && (
        <p className="text-sm text-muted-foreground">
          {results.length} {t("search.results", lang)} &quot;{query}&quot;
        </p>
      )}

      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th scope="col" className="text-left py-2 px-3">{t("common.school", lang)}</th>
                <th scope="col" className="text-left py-2 px-3">{t("common.municipality", lang)}</th>
                <th scope="col" className="text-left py-2 px-3">{t("common.type", lang)}</th>
                <th scope="col" className="text-right py-2 px-3">{t("common.merit", lang)}</th>
                <th scope="col" className="text-right py-2 px-3">{t("common.residual", lang)}</th>
                <th scope="col" className="text-right py-2 px-3">{t("common.years", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((s) => (
                <tr
                  key={s.school_code}
                  className="border-b last:border-0 hover:bg-accent/50"
                >
                  <td className="py-2 px-3">
                    <Link
                      href={`/school/${s.school_code}`}
                      className="text-primary hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {s.municipality_name}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.is_public
                        ? "bg-secondary text-secondary-foreground"
                        : "border text-muted-foreground"
                    }`}>
                      {s.is_public ? t("common.kommunal", lang) : t("common.enskild", lang)}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {s.latest_merit ?? "\u2013"}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <ResidualBadge value={s.latest_residual} />
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                    {s.year_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
