"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { CompareChart } from "./charts";
import { ResidualBadge } from "./residual-badge";
import { t, tf, type Lang } from "@/lib/i18n";
import type { SchoolSummary, SalsaResult } from "@/lib/db";

interface SelectedSchool {
  code: string;
  name: string;
  municipality: string;
}

export function CompareBuilder({
  initialSchools = [],
  lang,
}: {
  initialSchools?: SelectedSchool[];
  lang: Lang;
}) {
  const [selected, setSelected] = useState<SelectedSchool[]>(initialSchools);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SchoolSummary[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [compareData, setCompareData] = useState<SalsaResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search for suggestions
  const searchSchools = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const resp = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await resp.json();
      // Filter out already selected
      const codes = new Set(selected.map((s) => s.code));
      setSuggestions(data.filter((s: SchoolSummary) => !codes.has(s.school_code)));
    } catch {
      setSuggestions([]);
    }
  }, [selected]);

  const handleInput = (value: string) => {
    setQuery(value);
    setShowDropdown(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchSchools(value), 200);
  };

  const addSchool = (school: SchoolSummary) => {
    if (selected.length >= 5) return;
    const newSelected = [
      ...selected,
      { code: school.school_code, name: school.name, municipality: school.municipality_name },
    ];
    setSelected(newSelected);
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    fetchCompareData(newSelected);
    updateUrl(newSelected);
  };

  const removeSchool = (code: string) => {
    const newSelected = selected.filter((s) => s.code !== code);
    setSelected(newSelected);
    fetchCompareData(newSelected);
    updateUrl(newSelected);
  };

  const updateUrl = (schools: SelectedSchool[]) => {
    const codes = schools.map((s) => s.code).join(",");
    const url = codes ? `/compare?schools=${codes}` : "/compare";
    window.history.replaceState(null, "", url);
  };

  const fetchCompareData = async (schools: SelectedSchool[]) => {
    if (schools.length === 0) {
      setCompareData([]);
      return;
    }
    setLoading(true);
    try {
      const codes = schools.map((s) => s.code).join(",");
      const resp = await fetch(`/api/compare?schools=${codes}`);
      const data = await resp.json();
      setCompareData(data);
    } catch {
      setCompareData([]);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load initial data
  useEffect(() => {
    if (initialSchools.length > 0) {
      fetchCompareData(initialSchools);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pivot data for chart
  const chartData: Array<{ year: number; [key: string]: number | null }> = [];
  const yearMap = new Map<number, Record<string, number | null> & { year: number }>();
  for (const r of compareData) {
    if (!yearMap.has(r.year)) {
      yearMap.set(r.year, { year: r.year });
    }
    yearMap.get(r.year)![r.school_code] = r.avg_merit_value;
  }
  chartData.push(...Array.from(yearMap.values()).sort((a, b) => a.year - b.year));

  const schoolsForChart = selected.map((s) => ({ code: s.code, name: s.name }));

  return (
    <div className="space-y-6">
      {/* Search input with dropdown */}
      <div className="relative" ref={dropdownRef}>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder={
            selected.length >= 5
              ? t("compare.maxSelected", lang)
              : t("compare.placeholder", lang)
          }
          disabled={selected.length >= 5}
          aria-label={t("compare.ariaLabel", lang)}
          className="w-full max-w-xl px-4 py-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring text-base disabled:opacity-50"
        />

        {/* Dropdown suggestions */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 mt-1 w-full max-w-xl bg-card border rounded-lg shadow-lg max-h-72 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.school_code}
                onClick={() => addSchool(s)}
                className="w-full text-left px-4 py-2.5 hover:bg-accent flex items-center justify-between gap-2 border-b last:border-0"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.municipality_name} &middot;{" "}
                    {s.is_public ? t("common.kommunal", lang) : t("common.enskild", lang)}
                    {s.latest_merit !== null && ` \u00B7 ${t("common.merit", lang)}: ${s.latest_merit}`}
                  </div>
                </div>
                <span className="text-xs text-primary shrink-0">{t("compare.add", lang)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected schools pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((s) => (
            <span
              key={s.code}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
            >
              <span className="truncate max-w-48">{s.name}</span>
              <button
                onClick={() => removeSchool(s.code)}
                className="hover:bg-primary/20 rounded-full p-0.5"
                aria-label={`${t("compare.remove", lang)} ${s.name}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground animate-pulse">{t("compare.loading", lang)}</p>
      )}

      {/* Chart */}
      {chartData.length > 0 && schoolsForChart.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-1">{t("compare.meritOverTime", lang)}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {tf("compare.comparing", lang, { count: selected.length })}
          </p>
          <CompareChart data={chartData} schools={schoolsForChart} lang={lang} />
        </div>
      )}

      {/* Data table */}
      {compareData.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">{t("compare.detailedData", lang)}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th scope="col" className="text-left py-2 px-3">{t("common.school", lang)}</th>
                  <th scope="col" className="text-left py-2 px-3">{t("common.year", lang)}</th>
                  <th scope="col" className="text-right py-2 px-3">{t("common.merit", lang)}</th>
                  <th scope="col" className="text-right py-2 px-3">{t("common.predicted", lang)}</th>
                  <th scope="col" className="text-right py-2 px-3">{t("common.residual", lang)}</th>
                  <th scope="col" className="text-right py-2 px-3">{t("common.eligible", lang)}</th>
                </tr>
              </thead>
              <tbody>
                {compareData.map((r) => (
                  <tr
                    key={`${r.school_code}-${r.year}`}
                    className="border-b last:border-0 hover:bg-accent/50"
                  >
                    <td className="py-1.5 px-3">
                      <Link href={`/school/${r.school_code}`} className="text-primary hover:underline text-xs">
                        {r.school_name}
                      </Link>
                    </td>
                    <td className="py-1.5 px-3 tabular-nums">{r.year}</td>
                    <td className="py-1.5 px-3 text-right tabular-nums">
                      {r.avg_merit_value ?? "\u2013"}
                    </td>
                    <td className="py-1.5 px-3 text-right tabular-nums">
                      {r.predicted_merit_value ?? "\u2013"}
                    </td>
                    <td className="py-1.5 px-3 text-right">
                      <ResidualBadge value={r.residual_merit} />
                    </td>
                    <td className="py-1.5 px-3 text-right tabular-nums">
                      {r.pct_eligible_gymnasiet ?? "\u2013"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-muted-foreground text-sm">
          {t("compare.startComparing", lang)}
        </p>
      )}
    </div>
  );
}
