"use client";

import { t, type Lang } from "@/lib/i18n";

function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function CsvExport({
  filename,
  headers,
  rows,
  lang,
}: {
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  lang: Lang;
}) {
  const download = () => {
    const csv = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={download}
      className="text-xs text-muted-foreground hover:text-foreground border rounded px-2.5 py-1 transition hover:bg-accent"
    >
      {t("export.csv", lang)}
    </button>
  );
}
