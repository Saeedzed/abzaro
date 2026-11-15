/**
 * On-page SEO analysis — pure functions, no DOM, no network.
 *
 * Every limit used here is Google's *stated* behaviour or a documented
 * convention, and each constant says which. Nothing is invented: where the
 * honest answer is "Google truncates based on pixel width, not characters",
 * the code says so instead of pretending 155 is a hard rule.
 */

export const SEO_LIMITS = {
  /** Google renders roughly 50–60 chars of a title in a desktop SERP. */
  titleMin: 30,
  titleMax: 60,
  /** Meta descriptions are truncated around 120–158 chars depending on width. */
  descriptionMin: 70,
  descriptionMax: 158,
  /** One H1 per page is the convention; H2s structure the rest. */
  minWordsForLongContent: 300,
} as const;

export type Severity = "error" | "warning" | "ok";

export interface SeoIssue {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  /** What to do about it, in one sentence. */
  fix?: string;
}

export interface SeoAnalysis {
  title: { value: string; length: number; status: Severity };
  description: { value: string; length: number; status: Severity };
  headings: { level: number; text: string }[];
  h1Count: number;
  words: number;
  keyword: { value: string; count: number; density: number; inTitle: boolean; inDescription: boolean; inFirstHundred: boolean };
  issues: SeoIssue[];
  score: number;
}

/** Character length that counts Persian half-spaces as part of the word. */
export function charLength(value: string): number {
  return [...value.trim()].length;
}

/**
 * Keyword occurrences in a text. Persian words are matched with their ZWNJ
 * kept intact, and a whole-word boundary is enforced so «مالیات» does not match
 * inside «مالیاتی» unless the keyword itself ends the same way.
 */
export function countKeyword(text: string, keyword: string): number {
  const needle = keyword.trim();
  if (!needle) return 0;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  /**
   * The trailing boundary is a LOOKAHEAD on purpose. Without it, two identical
   * keywords separated by a single space ("مالیات مالیات") share that space and
   * the second match is consumed by the first — the count silently drops.
   */
  const boundary = "[\\s،.:؛!؟()\\[\\]{}«»\\-–—/\\\\\"'’\\u200c]";
  const pattern = new RegExp(`(?:^|${boundary})${escaped}(?=$|${boundary})`, "giu");
  return (text.match(pattern) ?? []).length;
}

export function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/u).length;
}

/** Keyword density as a percentage of total words. */
export function keywordDensity(text: string, keyword: string): number {
  const words = countWords(text);
  if (words === 0) return 0;
  return (countKeyword(text, keyword) / words) * 100;
}

/**
 * Parse headings out of raw HTML. Deliberately tiny: no DOM parser, so this
 * works in a Node test and in the browser identically.
 */
export function parseHeadings(html: string): { level: number; text: string }[] {
  const out: { level: number; text: string }[] = [];
  const pattern = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const text = (match[2] ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) out.push({ level: Number(match[1] ?? 0), text });
  }
  return out;
}

/** `<title>…</title>` from HTML, or "" when absent. */
export function parseTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? (match[1] ?? "").replace(/\s+/g, " ").trim() : "";
}

/** `<meta name="description" content="…">` from HTML, or "" when absent. */
export function parseDescription(html: string): string {
  const patterns = [
    /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return (match[1] ?? "").trim();
  }
  return "";
}

/** Human-readable text of an HTML document (tags stripped, entities kept simple). */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function statusFor(length: number, min: number, max: number): Severity {
  if (length === 0) return "error";
  if (length < min || length > max) return "warning";
  return "ok";
}

/**
 * Full on-page analysis of an HTML document.
 *
 * `keyword` is optional — without it the text-level checks are skipped rather
 * than reported as failures.
 */
export function analyzePage(html: string, keyword = ""): SeoAnalysis {
  const title = parseTitle(html);
  const description = parseDescription(html);
  const headings = parseHeadings(html);
  const text = htmlToText(html);
  const words = countWords(text);
  const h1Count = headings.filter((heading) => heading.level === 1).length;
  const firstHundred = text.split(/\s+/u).slice(0, 100).join(" ");
  const occurrences = keyword ? countKeyword(text, keyword) : 0;
  const density = keyword ? keywordDensity(text, keyword) : 0;

  const issues: SeoIssue[] = [];

  if (!title) {
    issues.push({
      id: "title-missing",
      severity: "error",
      title: "تگ title وجود ندارد",
      detail: "بدون title، گوگل عنوانی از محتوای صفحه می‌سازد که معمولاً بی‌ربط است.",
      fix: "یک <title> با ۳۰ تا ۶۰ نویسه بنویسید که کلیدواژهٔ اصلی در ابتدای آن باشد.",
    });
  } else {
    const length = charLength(title);
    if (length < SEO_LIMITS.titleMin) {
      issues.push({
        id: "title-short",
        severity: "warning",
        title: "عنوان کوتاه‌تر از حد معمول است",
        detail: `${length} نویسه؛ کمتر از ۳۰ نویسه یعنی فضای SERP هدر می‌رود.`,
        fix: "توضیح کوتاهی اضافه کنید (مثلاً «— رایگان و بدون ثبت‌نام»).",
      });
    } else if (length > SEO_LIMITS.titleMax) {
      issues.push({
        id: "title-long",
        severity: "warning",
        title: "عنوان بلندتر از حد نمایش است",
        detail: `${length} نویسه؛ گوگل عنوان‌های بلند را با «…» می‌بُرد.`,
        fix: "مهم‌ترین عبارت را به ابتدای عنوان منتقل کنید و بقیه را کوتاه کنید.",
      });
    }
  }

  if (!description) {
    issues.push({
      id: "description-missing",
      severity: "error",
      title: "متا دیسکریپشن وجود ندارد",
      detail: "گوگل خودش بخشی از متن را انتخاب می‌کند؛ کنترل پیام از دست می‌رود.",
      fix: "توضیحی ۷۰ تا ۱۵۸ نویسه‌ای با کلیدواژه و یک دعوت به اقدام بنویسید.",
    });
  } else {
    const length = charLength(description);
    if (length < SEO_LIMITS.descriptionMin || length > SEO_LIMITS.descriptionMax) {
      issues.push({
        id: "description-length",
        severity: "warning",
        title: "طول متا دیسکریپشن مناسب نیست",
        detail: `${length} نویسه؛ محدودهٔ پیشنهادی ۷۰ تا ۱۵۸ نویسه است.`,
        fix: "مهم‌ترین جمله را اول بیاورید و جمله‌های تکراری را حذف کنید.",
      });
    }
  }

  if (h1Count === 0) {
    issues.push({
      id: "h1-missing",
      severity: "error",
      title: "تیتر H1 وجود ندارد",
      detail: "H1 اصلی‌ترین نشانهٔ موضوع صفحه برای موتور جست‌وجو است.",
      fix: "یک <h1> بگذارید که موضوع صفحه را دقیق بگوید.",
    });
  } else if (h1Count > 1) {
    issues.push({
      id: "h1-multiple",
      severity: "warning",
      title: `${h1Count} تیتر H1 دارید`,
      detail: "چند H1 موضوع صفحه را رقیق می‌کند.",
      fix: "بقیه را به H2 تبدیل کنید.",
    });
  }

  const skippedLevels = headings.some((heading, index) => {
    const previous = headings[index - 1];
    return previous !== undefined && heading.level - previous.level > 1;
  });
  if (skippedLevels) {
    issues.push({
      id: "heading-skip",
      severity: "warning",
      title: "پرش سطح تیترها",
      detail: "مثلاً از H2 مستقیم به H4 رفته‌اید؛ ساختار برای screen reader هم نامفهوم می‌شود.",
      fix: "سطح‌ها را یکی‌یکی افزایش دهید.",
    });
  }

  if (words < SEO_LIMITS.minWordsForLongContent) {
    issues.push({
      id: "thin-content",
      severity: "warning",
      title: "محتوای صفحه کم است",
      detail: `${words} کلمه؛ صفحات زیر ۳۰۰ کلمه کمتر شانس رتبه دارند.`,
      fix: "پاسخ کوتاه، سؤال‌های متداول یا راهنمای گام‌به‌گام اضافه کنید.",
    });
  }

  if (keyword) {
    if (!countKeyword(title, keyword)) {
      issues.push({
        id: "keyword-title",
        severity: "warning",
        title: "کلیدواژه در عنوان نیست",
        detail: `«${keyword}» در title پیدا نشد.`,
        fix: "کلیدواژه را به ابتدای عنوان اضافه کنید.",
      });
    }
    if (!countKeyword(firstHundred, keyword)) {
      issues.push({
        id: "keyword-intro",
        severity: "warning",
        title: "کلیدواژه در ابتدای متن نیست",
        detail: "۱۰۰ کلمهٔ اول جای طبیعی تکرار کلیدواژه است.",
        fix: "کلیدواژه را در جملهٔ اول یا دوم بیاورید.",
      });
    }
    if (density > 3) {
      issues.push({
        id: "keyword-stuffing",
        severity: "warning",
        title: "چگالی کلیدواژه بالاست",
        detail: `${density.toFixed(1)}٪؛ بالای ۳٪ بوی keyword stuffing می‌دهد.`,
        fix: "بخشی از تکرارها را با ضمیر یا مترادف جایگزین کنید.",
      });
    }
  }

  const score = Math.max(
    0,
    100 -
      issues.filter((issue) => issue.severity === "error").length * 20 -
      issues.filter((issue) => issue.severity === "warning").length * 8,
  );

  return {
    title: { value: title, length: charLength(title), status: statusFor(charLength(title), SEO_LIMITS.titleMin, SEO_LIMITS.titleMax) },
    description: {
      value: description,
      length: charLength(description),
      status: statusFor(charLength(description), SEO_LIMITS.descriptionMin, SEO_LIMITS.descriptionMax),
    },
    headings,
    h1Count,
    words,
    keyword: {
      value: keyword,
      count: occurrences,
      density,
      inTitle: keyword ? countKeyword(title, keyword) > 0 : false,
      inDescription: keyword ? countKeyword(description, keyword) > 0 : false,
      inFirstHundred: keyword ? countKeyword(firstHundred, keyword) > 0 : false,
    },
    issues,
    score,
  };
}

/* ───────────────────────────── social preview ───────────────────────────── */

export interface SocialMeta {
  title: string;
  description: string;
  canonical: string;
  image: string;
  siteName: string;
  locale: string;
  twitterCard: string;
  ogType: string;
}

/**
 * Read the tags that actually drive a link preview on Telegram, WhatsApp,
 * Twitter/X and Facebook. Missing ones are returned empty so the UI can show
 * which platform would render a broken card.
 */
export function parseSocialMeta(html: string): SocialMeta {
  const meta = (name: string): string => {
    const propertyFirst = new RegExp(`<meta[^>]+property=["']${name}["'][^>]*content=["']([^"']*)["']`, "i");
    const contentFirst = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*property=["']${name}["']`, "i");
    const nameFirst = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i");
    const nameLast = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*name=["']${name}["']`, "i");
    for (const pattern of [propertyFirst, contentFirst, nameFirst, nameLast]) {
      const match = html.match(pattern);
      if (match) return (match[1] ?? "").trim();
    }
    return "";
  };
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)?.[1] ?? "";
  return {
    title: meta("og:title"),
    description: meta("og:description"),
    canonical,
    image: meta("og:image"),
    siteName: meta("og:site_name"),
    locale: meta("og:locale"),
    twitterCard: meta("twitter:card"),
    ogType: meta("og:type"),
  };
}

/* ──────────────────────────── robots / sitemap ──────────────────────────── */

export interface RobotsIssue {
  severity: Severity;
  message: string;
}

/** Sanity-check a robots.txt body. */
export function auditRobots(content: string): RobotsIssue[] {
  const issues: RobotsIssue[] = [];
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const hasUserAgent = lines.some((line) => /^user-agent:/i.test(line));
  const hasDisallowAll = lines.some((line) => /^disallow:\s*\/\s*$/i.test(line));
  const hasSitemap = lines.some((line) => /^sitemap:/i.test(line));

  if (!hasUserAgent) {
    issues.push({ severity: "error", message: "هیچ خط User-agent ای وجود ندارد؛ فایل robots بدون آن بی‌اثر است." });
  }
  if (hasDisallowAll) {
    issues.push({ severity: "error", message: "Disallow: / کل سایت را از ایندکس خارج می‌کند. اگر عمدی نیست، حذفش کنید." });
  }
  if (!hasSitemap) {
    issues.push({ severity: "warning", message: "خط Sitemap وجود ندارد؛ اعلام نقشهٔ سایت به خزش کمک می‌کند." });
  }
  if (issues.length === 0) {
    issues.push({ severity: "ok", message: "ساختار robots.txt درست به نظر می‌رسد." });
  }
  return issues;
}

/** Extract the first XML <loc> values from a sitemap body. */
export function parseSitemapUrls(xml: string): { urls: string[]; isIndex: boolean; malformed: boolean } {
  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) => match[1] ?? "");
  const isIndex = /<sitemapindex[\s>]/i.test(xml);
  const looksLikeXml = /<urlset[\s>]|<sitemapindex[\s>]/i.test(xml);
  return { urls, isIndex, malformed: looksLikeXml ? false : true };
}

/* ───────────────────────── FAQ / HowTo generator ───────────────────────── */

export function buildFaqJsonLd(items: Array<{ q: string; a: string }>): string {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items
        .filter((item) => item.q.trim() && item.a.trim())
        .map((item) => ({
          "@type": "Question",
          name: item.q.trim(),
          acceptedAnswer: { "@type": "Answer", text: item.a.trim() },
        })),
    },
    null,
    2,
  );
}

export function buildHowToJsonLd(name: string, steps: string[], totalTimeIso = ""): string {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: name.trim(),
      ...(totalTimeIso ? { totalTime: totalTimeIso } : {}),
      step: steps
        .filter((step) => step.trim())
        .map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          text: step.trim(),
        })),
    },
    null,
    2,
  );
}

export function buildLocalBusinessJsonLd(input: {
  name: string;
  address: string;
  phone: string;
  url: string;
  city?: string;
}): string {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: input.name.trim(),
      url: input.url.trim(),
      ...(input.phone.trim() ? { telephone: input.phone.trim() } : {}),
      address: {
        "@type": "PostalAddress",
        streetAddress: input.address.trim(),
        ...(input.city?.trim() ? { addressLocality: input.city.trim() } : {}),
        addressCountry: "IR",
      },
    },
    null,
    2,
  );
}

/* ─────────────────────────── SERP preview geometry ─────────────────────────── */

/**
 * Rough pixel width of a string in a 20px Arial SERP title.
 * Persian text is narrower per character than Latin uppercase, so we use a
 * conservative average. This is an estimate and the UI labels it as such.
 */
export function estimateSerpWidth(text: string, fontSize = 20): number {
  let width = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= 0x0600 && code <= 0x06ff) width += fontSize * 0.52;
    else if (char === " ") width += fontSize * 0.28;
    else width += fontSize * 0.55;
  }
  return Math.round(width);
}
