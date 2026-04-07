import type { MetadataRoute } from "next";
import { getAllSchoolCodes, getAllMunicipalityCodes, getDashboardStats } from "@/lib/db";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://skolsalsa.se";

  let lastmod: string;
  try {
    const stats = getDashboardStats();
    lastmod = `${stats.max_year}-09-01`;
  } catch {
    lastmod = new Date().toISOString().split("T")[0];
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: lastmod, changeFrequency: "yearly", priority: 1.0 },
    { url: `${baseUrl}/municipalities`, lastModified: lastmod, changeFrequency: "yearly", priority: 0.8 },
    { url: `${baseUrl}/trends`, lastModified: lastmod, changeFrequency: "yearly", priority: 0.8 },
    { url: `${baseUrl}/search`, lastModified: lastmod, changeFrequency: "yearly", priority: 0.6 },
    { url: `${baseUrl}/compare`, lastModified: lastmod, changeFrequency: "yearly", priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: lastmod, changeFrequency: "yearly", priority: 0.5 },
  ];

  let schoolPages: MetadataRoute.Sitemap = [];
  let muniPages: MetadataRoute.Sitemap = [];

  try {
    const schoolCodes = getAllSchoolCodes();
    schoolPages = schoolCodes.map((code) => ({
      url: `${baseUrl}/school/${code}`,
      lastModified: lastmod,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    }));

    const muniCodes = getAllMunicipalityCodes();
    muniPages = muniCodes.map((code) => ({
      url: `${baseUrl}/municipality/${code}`,
      lastModified: lastmod,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB not available — return static pages only
  }

  return [...staticPages, ...muniPages, ...schoolPages];
}
