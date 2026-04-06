import type { MetadataRoute } from "next";
import { getAllSchoolCodes, getAllMunicipalityCodes } from "@/lib/db";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://skolsalsa.se";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "yearly", priority: 1.0 },
    { url: `${baseUrl}/municipalities`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/search`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/compare`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/trends`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/about`, changeFrequency: "yearly", priority: 0.5 },
  ];

  let schoolPages: MetadataRoute.Sitemap = [];
  let muniPages: MetadataRoute.Sitemap = [];

  try {
    const schoolCodes = getAllSchoolCodes();
    schoolPages = schoolCodes.map((code) => ({
      url: `${baseUrl}/school/${code}`,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    }));

    const muniCodes = getAllMunicipalityCodes();
    muniPages = muniCodes.map((code) => ({
      url: `${baseUrl}/municipality/${code}`,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB not available — return static pages only
  }

  return [...staticPages, ...muniPages, ...schoolPages];
}
