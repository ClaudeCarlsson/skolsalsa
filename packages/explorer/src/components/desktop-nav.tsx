"use client";

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

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function DesktopNav({ lang }: { lang: Lang }) {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex flex-wrap gap-x-1 gap-y-1 text-sm">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-2.5 py-1 rounded-md transition ${
            isActive(pathname, item.href)
              ? "bg-accent text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          }`}
        >
          {t(item.key, lang)}
        </Link>
      ))}
    </nav>
  );
}
