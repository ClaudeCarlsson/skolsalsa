"use client";

import { useCallback, useSyncExternalStore } from "react";
import { t, type Lang } from "@/lib/i18n";

const STORAGE_KEY = "skolsalsa-favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function setFavorites(codes: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  window.dispatchEvent(new Event("favorites-changed"));
}

let snapshotCache = "[]";

function subscribe(callback: () => void) {
  const handler = () => {
    snapshotCache = localStorage.getItem(STORAGE_KEY) || "[]";
    callback();
  };
  window.addEventListener("favorites-changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("favorites-changed", handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot() {
  if (typeof window === "undefined") return "[]";
  const val = localStorage.getItem(STORAGE_KEY) || "[]";
  snapshotCache = val;
  return snapshotCache;
}

function getServerSnapshot() {
  return "[]";
}

function useFavorites(): string[] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function FavoriteButton({
  schoolCode,
  lang,
  size = "md",
}: {
  schoolCode: string;
  lang: Lang;
  size?: "sm" | "md";
}) {
  const favorites = useFavorites();
  const isFavorite = favorites.includes(schoolCode);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const favs = getFavorites();
    if (favs.includes(schoolCode)) {
      setFavorites(favs.filter((c) => c !== schoolCode));
    } else {
      setFavorites([...favs, schoolCode]);
    }
  }, [schoolCode]);

  const dim = size === "sm" ? 16 : 20;

  return (
    <button
      onClick={toggle}
      className="text-muted-foreground hover:text-amber-500 transition shrink-0"
      aria-label={isFavorite ? t("favorites.saved", lang) : t("favorites.save", lang)}
      title={isFavorite ? t("favorites.saved", lang) : t("favorites.save", lang)}
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isFavorite ? "text-amber-500" : ""}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}
