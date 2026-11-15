import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { categories } from "@/data/categories";
import { tools } from "@/data/tools";
import { posts } from "@/data/posts";
import { landings } from "@/data/landings";

/** Required so `output: "export"` (ABZARO_EXPORT=1) can prerender this route. */
export const dynamic = "force-static";

/**
 * XML sitemap generated from the same data registries that power the site,
 * so new tools/posts/categories appear automatically.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteConfig.url}/tools`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteConfig.url}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.url}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.url}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteConfig.url}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteConfig.url}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteConfig.url}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteConfig.url}/compare`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  // Short, keyword-shaped landing pages (/salary, /pdf, …) — high SEO priority.
  const landingRoutes: MetadataRoute.Sitemap = landings.map((landing) => ({
    url: `${siteConfig.url}/${landing.path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const toolRoutes: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${siteConfig.url}/tools/${tool.slug}`,
    lastModified: new Date(tool.addedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteConfig.url}/categories/${category.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...landingRoutes,
    ...toolRoutes,
    ...categoryRoutes,
    ...postRoutes,
  ];
}
