"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

const navItems = [
  { href: "/", key: "nav.dashboard" as const },
  { href: "/municipalities", key: "nav.municipalities" as const },
  { href: "/search", key: "nav.search" as const },
  { href: "/compare", key: "nav.compare" as const },
  { href: "/trends", key: "nav.trends" as const },
  { href: "/about", key: "nav.about" as const },
  { href: "/favorites", key: "nav.favorites" as const },
];

export function MobileNav({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Prevent scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden p-1.5 -mr-1.5 text-muted-foreground hover:text-foreground transition"
        aria-label="Menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 top-[53px] z-50 bg-background/95 backdrop-blur-sm md:hidden">
          <nav className="flex flex-col px-6 py-4 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`py-3 px-3 rounded-lg text-base font-medium transition ${
                  pathname === item.href
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {t(item.key, lang)}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
