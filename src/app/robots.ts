import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** Required so `output: "export"` (ABZARO_EXPORT=1) can prerender this route. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
