/**
 * Central site configuration.
 *
 * The canonical origin comes from NEXT_PUBLIC_SITE_URL (see .env.example).
 * Everything SEO-related (metadata, sitemap, robots, JSON-LD) reads from here,
 * so deploying to a real domain only requires one environment variable.
 */
export const siteConfig = {
  /** Persian brand name */
  name: "ابزارو",
  /** Latin brand name */
  brand: "Abzaro",
  tagline: "ابزارهای کاربردی، سریع و رایگان",
  description:
    "مجموعه‌ای از ابزارهای آنلاین رایگان برای انجام سریع کارهای روزمره، محاسبات، ویرایش متن و تصاویر.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://abzaro.ir",
  locale: "fa_IR",
  language: "fa",
  email: "hello@abzaro.ir",
  twitterHandle: "@abzaro",
} as const;

export type SiteConfig = typeof siteConfig;
