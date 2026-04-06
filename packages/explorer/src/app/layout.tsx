import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Link from "next/link";
import { getLangFromCookie, t } from "@/lib/i18n";
import { LangToggle } from "@/components/lang-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);

  return {
    title: t("meta.title", lang),
    description: t("meta.description", lang),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b bg-card">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-bold text-lg">
              SkolSalsa
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition">
                {t("nav.dashboard", lang)}
              </Link>
              <Link
                href="/municipalities"
                className="hover:text-foreground transition"
              >
                {t("nav.municipalities", lang)}
              </Link>
              <Link
                href="/search"
                className="hover:text-foreground transition"
              >
                {t("nav.search", lang)}
              </Link>
              <Link
                href="/compare"
                className="hover:text-foreground transition"
              >
                {t("nav.compare", lang)}
              </Link>
              <Link
                href="/trends"
                className="hover:text-foreground transition"
              >
                {t("nav.trends", lang)}
              </Link>
              <Link
                href="/about"
                className="hover:text-foreground transition"
              >
                {t("nav.about", lang)}
              </Link>
              <Link
                href="/favorites"
                className="hover:text-foreground transition"
              >
                {t("nav.favorites", lang)}
              </Link>
            </nav>
            <LangToggle lang={lang} />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t py-4 text-center text-xs text-muted-foreground">
          {t("footer.dataFrom", lang)}{" "}
          <a
            href="https://siris.skolverket.se"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Skolverket SIRIS/SALSA
          </a>
          . {t("footer.notAffiliated", lang)}
          {" | "}
          <a
            href="https://github.com/ClaudeCarlsson/skolsalsa"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </footer>
      </body>
    </html>
  );
}
