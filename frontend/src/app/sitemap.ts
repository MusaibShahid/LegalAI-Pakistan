import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://legalsearch.pk";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sources`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  // Popular search queries for SEO
  const popularSearches = [
    "bail",
    "murder",
    "theft",
    "cheating",
    "cybercrime",
    "divorce",
    "maintenance",
    "property",
    "tax",
    "constitution",
    "article-199",
    "section-302-ppc",
    "section-497-crpc",
    "section-420-ppc",
    "section-489f-ppc",
    "peca-section-20",
    "scmr-2024",
    "pld-2024",
    "supreme-court-judgments",
    "lahore-high-court",
    "sindh-high-court",
    "islamabad-high-court",
    "pakistan-penal-code",
    "criminal-procedure-code",
  ];

  const searchPages: MetadataRoute.Sitemap = popularSearches.map((query) => ({
    url: `${baseUrl}/search?q=${encodeURIComponent(query)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...searchPages];
}
