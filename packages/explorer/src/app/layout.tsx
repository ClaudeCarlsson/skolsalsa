import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Link from "next/link";
import { getLangFromCookie, t } from "@/lib/i18n";
import { LangToggle } from "@/components/lang-toggle";
import { DesktopNav } from "@/components/desktop-nav";
import { MobileNav } from "@/components/mobile-nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
    title: { default: t("meta.title", lang), template: "%s" },
    description: t("meta.description", lang),
    metadataBase: new URL("https://skolsalsa.se"),
    alternates: {
      canonical: "/",
      languages: { sv: "/", en: "/" },
    },
    keywords: lang === "sv"
      ? ["SALSA", "skolresultat", "meritvärde", "residual", "grundskola", "Skolverket", "kommuner", "skolstatistik", "gymnasiebehörighet", "skoljämförelse"]
      : ["SALSA", "school results", "merit value", "residual", "compulsory school", "Skolverket", "municipalities", "school statistics", "eligibility", "school comparison"],
    authors: [{ name: "SkolSalsa" }],
    creator: "SkolSalsa",
    publisher: "SkolSalsa",
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
    openGraph: {
      type: "website",
      locale: lang === "sv" ? "sv_SE" : "en_US",
      url: "https://skolsalsa.se",
      siteName: "SkolSalsa",
      title: t("meta.title", lang),
      description: t("meta.description", lang),
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta.title", lang),
      description: t("meta.description", lang),
    },
    other: {
      "google-site-verification": "skolsalsa-se",
    },
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
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: "SkolSalsa",
                  url: "https://skolsalsa.se",
                  description: lang === "sv"
                    ? "Utforska svenska skolors resultat med Skolverkets SALSA-modell. Meritvärden, residualer och trender för 1 500+ skolor 1998–2025."
                    : "Explore Swedish school performance with Skolverket's SALSA model. Merit values, residuals and trends for 1,500+ schools 1998–2025.",
                  inLanguage: [lang === "sv" ? "sv-SE" : "en"],
                  potentialAction: {
                    "@type": "SearchAction",
                    target: { "@type": "EntryPoint", urlTemplate: "https://skolsalsa.se/search?q={search_term_string}" },
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "Dataset",
                  name: "Swedish School SALSA Results 1998–2025",
                  description: "Merit values, predicted values, residuals, eligibility rates and demographic data for 1,535 Swedish schools across 290 municipalities, sourced from Skolverket SIRIS.",
                  url: "https://skolsalsa.se",
                  license: "https://www.skolverket.se",
                  creator: { "@type": "Organization", name: "Skolverket", url: "https://www.skolverket.se" },
                  temporalCoverage: "1998/2025",
                  spatialCoverage: { "@type": "Place", name: "Sweden" },
                  variableMeasured: [
                    "Average merit value",
                    "Predicted merit value",
                    "Residual (actual minus predicted)",
                    "Gymnasiet eligibility rate",
                    "Parents education level",
                    "Newly arrived students percentage",
                  ],
                },
                {
                  "@type": "Organization",
                  name: "SkolSalsa",
                  url: "https://skolsalsa.se",
                  sameAs: ["https://github.com/ClaudeCarlsson/skolsalsa"],
                },
              ],
            }),
          }}
        />
        <header className="border-b bg-card sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-bold text-lg shrink-0">
              SkolSalsa
            </Link>
            <DesktopNav lang={lang} />
            <div className="ml-auto flex items-center gap-2">
              <LangToggle lang={lang} />
              <MobileNav lang={lang} />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t py-4 text-center text-xs text-muted-foreground px-4">
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
