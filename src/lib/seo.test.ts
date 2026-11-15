import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  analyzePage,
  auditRobots,
  buildFaqJsonLd,
  buildHowToJsonLd,
  charLength,
  countKeyword,
  countWords,
  estimateSerpWidth,
  htmlToText,
  keywordDensity,
  parseDescription,
  parseHeadings,
  parseSitemapUrls,
  parseSocialMeta,
  parseTitle,
} from "./seo";

const SAMPLE = `<!doctype html><html dir="rtl"><head>
<title>محاسبهٔ حقوق و مالیات ۱۴۰۴ — رایگان</title>
<meta name="description" content="حقوق خالص و ناخالص را با بیمه، معافیت و پله‌های مالیاتی ۱۴۰۴ حساب کنید؛ بدون ثبت‌نام و کاملاً در مرورگر.">
<meta property="og:title" content="محاسبهٔ حقوق"><meta property="og:image" content="https://x.test/og.png">
<meta property="og:site_name" content="ابزارو"><meta property="og:type" content="website">
<meta property="og:locale" content="fa_IR"><meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://x.test/salary">
</head><body>
<h1>ماشین‌حساب حقوق و مالیات</h1>
<h2>چطور حساب می‌شود؟</h2>
<h3>بیمهٔ سهم کارگر</h3>
<p>${"حقوق و مالیات در مرورگر شما محاسبه می‌شود. ".repeat(60)}</p>
</body></html>`;

describe("parsing", () => {
  it("reads title, description and headings", () => {
    assert.equal(parseTitle(SAMPLE), "محاسبهٔ حقوق و مالیات ۱۴۰۴ — رایگان");
    assert.match(parseDescription(SAMPLE), /حقوق خالص و ناخالص/);
    const headings = parseHeadings(SAMPLE);
    assert.deepEqual(headings.map((h) => h.level), [1, 2, 3]);
    assert.equal(headings[0]?.text, "ماشین‌حساب حقوق و مالیات");
  });

  it("strips tags and scripts to text", () => {
    const text = htmlToText("<p>سلام <b>دنیا</b></p><script>alert(1)</script>");
    assert.equal(text, "سلام دنیا");
  });

  it("counts words and characters", () => {
    assert.equal(countWords("یک دو سه"), 3);
    assert.equal(countWords("   "), 0);
    assert.equal(charLength("۱۲۳"), 3);
  });

  it("counts a keyword with whole-word boundaries", () => {
    assert.equal(countKeyword("مالیات بر حقوق و مالیات ارزش افزوده", "مالیات"), 2);
    // must not match inside a longer word
    assert.equal(countKeyword("مالیاتی بودن", "مالیات"), 0);
  });

  it("computes density as a percentage", () => {
    const text = "مالیات ".repeat(5) + "واژه ".repeat(45);
    const density = keywordDensity(text, "مالیات");
    assert.ok(Math.abs(density - 10) < 0.01, String(density));
  });

  it("reads social meta tags", () => {
    const meta = parseSocialMeta(SAMPLE);
    assert.equal(meta.title, "محاسبهٔ حقوق");
    assert.equal(meta.image, "https://x.test/og.png");
    assert.equal(meta.canonical, "https://x.test/salary");
    assert.equal(meta.twitterCard, "summary_large_image");
  });
});

describe("analyzePage", () => {
  it("scores a well-built page highly and reports no errors", () => {
    const analysis = analyzePage(SAMPLE, "مالیات");
    const errors = analysis.issues.filter((issue) => issue.severity === "error");
    assert.equal(errors.length, 0, JSON.stringify(errors));
    assert.ok(analysis.score >= 80, String(analysis.score));
    assert.equal(analysis.h1Count, 1);
    assert.ok(analysis.keyword.inTitle);
    assert.ok(analysis.keyword.count > 0);
  });

  it("flags a page with nothing set", () => {
    const analysis = analyzePage("<html><body>متن کوتاه</body></html>");
    const ids = analysis.issues.map((issue) => issue.id);
    assert.ok(ids.includes("title-missing"));
    assert.ok(ids.includes("description-missing"));
    assert.ok(ids.includes("h1-missing"));
    assert.ok(ids.includes("thin-content"));
  });

  it("flags multiple H1s and skipped heading levels", () => {
    const html = `<title>عنوان تست برای بررسی طول بهینه عنوان صفحه</title><h1>الف</h1><h1>ب</h1><h3>ج</h3>`;
    const ids = analyzePage(html).issues.map((issue) => issue.id);
    assert.ok(ids.includes("h1-multiple"));
    assert.ok(ids.includes("heading-skip"));
  });

  it("warns when the keyword is missing from the title", () => {
    const analysis = analyzePage(SAMPLE, "وام");
    const issue = analysis.issues.find((item) => item.id === "keyword-title");
    assert.ok(issue);
    assert.equal(analysis.keyword.inTitle, false);
  });

  it("never goes below zero", () => {
    const broken = "<html><body></body></html>";
    assert.ok(analyzePage(broken, "ایکس").score >= 0);
  });
});

describe("robots", () => {
  it("accepts a sane file", () => {
    const issues = auditRobots("User-agent: *\nAllow: /\nSitemap: https://x.test/sitemap.xml");
    assert.equal(issues[0]?.severity, "ok");
  });

  it("catches disallow-all and a missing sitemap", () => {
    const issues = auditRobots("User-agent: *\nDisallow: /");
    const messages = issues.map((issue) => issue.message).join(" ");
    assert.match(messages, /کل سایت/);
    assert.match(messages, /Sitemap/);
  });

  it("catches a missing user-agent", () => {
    const issues = auditRobots("Disallow:\n");
    assert.ok(issues.some((issue) => /User-agent/.test(issue.message)));
  });
});

describe("sitemap", () => {
  it("reads a urlset", () => {
    const xml = `<?xml version="1.0"?><urlset><url><loc>https://x.test/a</loc></url><url><loc>https://x.test/b</loc></url></urlset>`;
    const result = parseSitemapUrls(xml);
    assert.deepEqual(result.urls, ["https://x.test/a", "https://x.test/b"]);
    assert.equal(result.isIndex, false);
    assert.equal(result.malformed, false);
  });

  it("detects a sitemap index", () => {
    const xml = `<sitemapindex><sitemap><loc>https://x.test/s1.xml</loc></sitemap></sitemapindex>`;
    const result = parseSitemapUrls(xml);
    assert.equal(result.isIndex, true);
    assert.equal(result.urls.length, 1);
  });

  it("flags a body that is not XML at all", () => {
    assert.equal(parseSitemapUrls("<html>404</html>").malformed, true);
  });
});

describe("structured data builders", () => {
  it("builds valid FAQPage JSON", () => {
    const json = JSON.parse(buildFaqJsonLd([{ q: "سؤال؟", a: "پاسخ." }, { q: " ", a: "" }]));
    assert.equal(json["@type"], "FAQPage");
    assert.equal(json.mainEntity.length, 1);
    assert.equal(json.mainEntity[0]?.acceptedAnswer?.text, "پاسخ.");
  });

  it("builds HowTo with positions", () => {
    const json = JSON.parse(buildHowToJsonLd("چطور", ["اول", "دوم"]));
    assert.equal(json.step.length, 2);
    assert.equal(json.step[1].position, 2);
  });
});

describe("SERP width estimate", () => {
  it("grows with length and is plausible for a 60-char Persian title", () => {
    const short = estimateSerpWidth("کوتاه");
    const long = estimateSerpWidth("کوتاه ".repeat(10));
    assert.ok(long > short);
    const sixty = estimateSerpWidth("ا".repeat(60));
    assert.ok(sixty > 500 && sixty < 800, String(sixty));
  });
});
