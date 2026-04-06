"use client";

import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";

export function LangToggle({ lang }: { lang: Lang }) {
  const router = useRouter();

  const toggle = () => {
    const next = lang === "sv" ? "en" : "sv";
    document.cookie = `lang=${next};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      className="text-xs px-2 py-1 rounded border hover:bg-accent transition tabular-nums"
      aria-label={lang === "sv" ? "Switch to English" : "Byt till svenska"}
    >
      {lang === "sv" ? "EN" : "SV"}
    </button>
  );
}
