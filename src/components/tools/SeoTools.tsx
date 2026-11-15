"use client";

import { useMemo, useState } from "react";
import { Braces, Map, ShieldCheck, Link2 } from "lucide-react";
import {
  auditRobots,
  buildFaqJsonLd,
  buildHowToJsonLd,
  buildLocalBusinessJsonLd,
  charLength,
  parseSitemapUrls,
  parseSocialMeta,
  SEO_LIMITS,
  estimateSerpWidth,
} from "@/lib/seo";
import { CopyButton } from "./CopyButton";
import { ResultHint, ToolPanel } from "./shared";

/* ─────────────────── ۱. عنوان و متا (title & description) ─────────────────── */

/** Writes the full `<head>` snippet from a title + description. */
export function MetaTagGenerator() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("https://abzaro.ir/");
  const [siteName, setSiteName] = useState("ابزارو");
  const [image, setImage] = useState("https://abzaro.ir/og-default.png");

  const snippet = useMemo(
    () =>
      [
        `<title>${title}</title>`,
        `<meta name="description" content="${description}">`,
        `<link rel="canonical" href="${url}">`,
        "",
        `<meta property="og:type" content="website">`,
        `<meta property="og:site_name" content="${siteName}">`,
        `<meta property="og:locale" content="fa_IR">`,
        `<meta property="og:title" content="${title}">`,
        `<meta property="og:description" content="${description}">`,
        `<meta property="og:url" content="${url}">`,
        image ? `<meta property="og:image" content="${image}">` : null,
        "",
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${title}">`,
        `<meta name="twitter:description" content="${description}">`,
        image ? `<meta name="twitter:image" content="${image}">` : null,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    [title, description, url, siteName, image],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel title="مقادیر" icon={<Link2 className="h-4 w-4 text-brand-600" aria-hidden="true" />}>
        <div className="space-y-3">
          <Text label="عنوان صفحه" value={title} onChange={setTitle} testId="meta-title" counter={{ length: charLength(title), min: SEO_LIMITS.titleMin, max: SEO_LIMITS.titleMax }} placeholder="محاسبهٔ حقوق ۱۴۰۴" />
          <Text label="متا دیسکریپشن" value={description} onChange={setDescription} rows={3} testId="meta-description" counter={{ length: charLength(description), min: SEO_LIMITS.descriptionMin, max: SEO_LIMITS.descriptionMax }} placeholder="توضیح ۷۰–۱۵۸ نویسه‌ای صفحه…" />
          <Text label="آدرس صفحه (canonical)" value={url} onChange={setUrl} ltr testId="meta-url" placeholder="https://abzaro.ir/salary" />
          <Text label="نام سایت" value={siteName} onChange={setSiteName} testId="meta-sitename" placeholder="ابزارو" />
          <Text label="تصویر اشتراک‌گذاری (OG image)" value={image} onChange={setImage} ltr testId="meta-image" placeholder="https://…/og.png" />
        </div>
      </ToolPanel>
      <ToolPanel title="کد آماده" icon={<Braces className="h-4 w-4 text-brand-600" aria-hidden="true" />}>
        {title.trim() === "" && description.trim() === "" ? (
          <ResultHint>عنوان و توضیح را وارد کنید تا کد کامل ساخته شود.</ResultHint>
        ) : (
          <div data-testid="meta-output">
            <div className="flex justify-end">
              <CopyButton value={snippet} label="کپی کد" />
            </div>
            <pre dir="ltr" className="mt-1 max-h-80 overflow-auto rounded-xl bg-ink-900 p-3 text-left font-mono text-[11px] leading-5 text-ink-100">
              {snippet}
            </pre>
            <p className="mt-2 text-[11px] leading-5 text-ink-500">
              این کد را داخل تگ <code className="font-mono">&lt;head&gt;</code> بگذارید. عرض تخمینی عنوان در نتایج گوگل:{" "}
              {estimateSerpWidth(title)} پیکسل.
            </p>
          </div>
        )}
      </ToolPanel>
    </div>
  );
}

/* ───────────────────── ۲. تحلیل تگ‌های اجتماعی ───────────────────── */

export function SocialTagChecker() {
  const [html, setHtml] = useState("");
  const meta = useMemo(() => (html.trim() ? parseSocialMeta(html) : null), [html]);

  const rows = REQUIRED_SOCIAL;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel title="کد صفحه" icon={<Link2 className="h-4 w-4 text-brand-600" aria-hidden="true" />}>
        <textarea
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          rows={12}
          dir="ltr"
          data-testid="social-html"
          placeholder={'<meta property="og:title" content="…">'}
          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-left font-mono text-xs leading-6 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
      </ToolPanel>
      <ToolPanel title="نتیجه">
        {meta === null ? (
          <ResultHint>کد صفحه را بچسبانید تا تگ‌های پیش‌نمایش بررسی شوند.</ResultHint>
        ) : (
          <ul className="space-y-2" data-testid="social-result">
            {rows.map((row) => {
              const value = meta[row.key];
              const found = value !== "";
              return (
                <li key={row.key} className={`rounded-xl border px-3 py-2 text-xs ${found ? "border-emerald-200 bg-emerald-50" : row.required ? "border-rose-200 bg-rose-50" : "border-ink-200 bg-white"}`}>
                  <p className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-ink-500" dir="ltr">{row.key}</span>
                    <span className={`font-bold ${found ? "text-emerald-700" : row.required ? "text-rose-700" : "text-ink-400"}`}>
                      {found ? "موجود" : row.required ? "ندارد" : "اختیاری نیست"}
                    </span>
                  </p>
                  {found && <p dir="auto" className="mt-1 break-all text-ink-700">{value}</p>}
                </li>
              );
            })}
            <li className="rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-5 text-ink-500">
              تلگرام، واتساپ و توییتر/ایکس از همین تگ‌های <code className="font-mono">og:</code> استفاده می‌کنند؛ اگر{" "}
              <code className="font-mono">og:image</code> نباشد، کارت لینک بدون تصویر نمایش داده می‌شود.
            </li>
          </ul>
        )}
      </ToolPanel>
    </div>
  );
}

const REQUIRED_SOCIAL: Array<{ key: "title" | "description" | "image" | "siteName" | "locale" | "ogType" | "twitterCard" | "canonical"; label: string; required: boolean }> = [
  { key: "title", label: "og:title", required: true },
  { key: "description", label: "og:description", required: true },
  { key: "image", label: "og:image", required: true },
  { key: "siteName", label: "og:site_name", required: false },
  { key: "locale", label: "og:locale", required: false },
  { key: "ogType", label: "og:type", required: false },
  { key: "twitterCard", label: "twitter:card", required: false },
  { key: "canonical", label: "canonical", required: true },
];

/* ───────────────────── ۳. تحلیل تیترها ───────────────────── */

export function HeadingAnalyzer() {
  const [html, setHtml] = useState("");
  const [result, setResult] = useState<Array<{ level: number; text: string }> | null>(null);

  function analyze() {
    // Imported lazily so the page's initial bundle stays small.
    import("@/lib/seo").then((mod) => setResult(mod.parseHeadings(html)));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel title="کد HTML" icon={<Braces className="h-4 w-4 text-brand-600" aria-hidden="true" />}>
        <textarea
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          rows={12}
          dir="ltr"
          data-testid="headings-html"
          placeholder={"<h1>تیتر اصلی</h1>\n<h2>بخش اول</h2>"}
          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-left font-mono text-xs leading-6 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
        <button type="button" onClick={analyze} disabled={!html.trim()} className="mt-3 min-h-11 w-full rounded-xl bg-brand-600 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-40">
          تحلیل تیترها
        </button>
      </ToolPanel>
      <ToolPanel title="ساختار تیترها">
        {result === null ? (
          <ResultHint>کد را بچسبانید و «تحلیل تیترها» را بزنید.</ResultHint>
        ) : result.length === 0 ? (
          <ResultHint>هیچ تیتری (h1 تا h6) در کد پیدا نشد.</ResultHint>
        ) : (
          <div data-testid="headings-result">
            <ul className="space-y-1">
              {result.map((heading, index) => (
                <li key={index} className="text-xs leading-6 text-ink-700" style={{ paddingInlineStart: `${(heading.level - 1) * 12}px` }}>
                  <span className={`me-1.5 rounded px-1 font-mono text-[10px] ${heading.level === 1 ? "bg-brand-100 text-brand-700" : "bg-ink-100 text-ink-500"}`}>H{heading.level}</span>
                  {heading.text}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-5 text-ink-500">
              {result.filter((heading) => heading.level === 1).length === 1
                ? "یک H1 دارید — درست است."
                : `تعداد H1: ${result.filter((heading) => heading.level === 1).length} — بهتر است دقیقاً یکی باشد.`}
            </p>
          </div>
        )}
      </ToolPanel>
    </div>
  );
}

/* ───────────────────── ۴. بررسی robots.txt ───────────────────── */

export function RobotsTxtChecker() {
  const [content, setContent] = useState("");
  const issues = useMemo(() => (content.trim() ? auditRobots(content) : null), [content]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel title="محتوای robots.txt" icon={<ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />}>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={10}
          dir="ltr"
          data-testid="robots-input"
          placeholder={"User-agent: *\nAllow: /\nSitemap: https://abzaro.ir/sitemap.xml"}
          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-left font-mono text-xs leading-6 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
      </ToolPanel>
      <ToolPanel title="بررسی">
        {issues === null ? (
          <ResultHint>محتوای فایل را بچسبانید.</ResultHint>
        ) : (
          <ul className="space-y-2" data-testid="robots-result">
            {issues.map((issue, index) => (
              <li
                key={index}
                className={`rounded-xl border px-3 py-2.5 text-xs leading-6 ${
                  issue.severity === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : issue.severity === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {issue.message}
              </li>
            ))}
          </ul>
        )}
      </ToolPanel>
    </div>
  );
}

/* ───────────────────── ۵. بررسی sitemap ───────────────────── */

export function SitemapChecker() {
  const [xml, setXml] = useState("");
  const result = useMemo(() => (xml.trim() ? parseSitemapUrls(xml) : null), [xml]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel title="محتوای sitemap.xml" icon={<Map className="h-4 w-4 text-brand-600" aria-hidden="true" />}>
        <textarea
          value={xml}
          onChange={(event) => setXml(event.target.value)}
          rows={10}
          dir="ltr"
          data-testid="sitemap-input"
          placeholder={"<?xml version=\"1.0\"?>\n<urlset>…</urlset>"}
          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-left font-mono text-xs leading-6 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
      </ToolPanel>
      <ToolPanel title="نتیجه">
        {result === null ? (
          <ResultHint>محتوای نقشهٔ سایت را بچسبانید.</ResultHint>
        ) : result.malformed ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-6 text-rose-800" data-testid="sitemap-result">
            این متن یک نقشهٔ سایت معتبر نیست: نه <code className="font-mono">&lt;urlset&gt;</code> دارد نه{" "}
            <code className="font-mono">&lt;sitemapindex&gt;</code>. معمولاً یعنی آدرس اشتباه است و سرور صفحهٔ ۴۰۴ را برگردانده.
          </div>
        ) : (
          <div data-testid="sitemap-result">
            <p className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-xs text-ink-700">
              نوع: <strong>{result.isIndex ? "ایندکس نقشه‌ها (sitemapindex)" : "نقشهٔ آدرس‌ها (urlset)"}</strong> · تعداد آدرس:{" "}
              <strong>{result.urls.length}</strong>
            </p>
            <ul className="mt-2 max-h-72 space-y-1 overflow-auto">
              {result.urls.slice(0, 200).map((url) => (
                <li key={url} dir="ltr" className="truncate rounded-lg bg-ink-50 px-2 py-1 text-left font-mono text-[10px] text-ink-600">
                  {url}
                </li>
              ))}
            </ul>
            {result.urls.length > 200 && <p className="mt-2 text-[11px] text-ink-400">۲۰۰ آدرس اول نمایش داده شد.</p>}
          </div>
        )}
      </ToolPanel>
    </div>
  );
}

/* ───────────────────── ۶. سازندهٔ Schema ───────────────────── */

type SchemaKind = "faq" | "howto" | "local";

export function SchemaGenerator() {
  const [kind, setKind] = useState<SchemaKind>("faq");
  const [name, setName] = useState("");
  const [rows, setRows] = useState([{ q: "", a: "" }]);
  const [steps, setSteps] = useState(["", ""]);
  const [local, setLocal] = useState({ name: "", address: "", phone: "", url: "", city: "" });

  const output = useMemo(() => {
    if (kind === "faq") return buildFaqJsonLd(rows.filter((row) => row.q.trim() && row.a.trim()));
    if (kind === "howto") return buildHowToJsonLd(name, steps.filter((step) => step.trim()));
    return buildLocalBusinessJsonLd(local);
  }, [kind, rows, steps, name, local]);

  const empty =
    kind === "faq"
      ? !rows.some((row) => row.q.trim() && row.a.trim())
      : kind === "howto"
        ? !name.trim() || !steps.some((step) => step.trim())
        : !local.name.trim() || !local.address.trim();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel title="نوع Schema" icon={<Braces className="h-4 w-4 text-brand-600" aria-hidden="true" />}>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="نوع اسکیما">
          {([
            ["faq", "پرسش متداول"],
            ["howto", "آموزش گام‌به‌گام"],
            ["local", "کسب‌وکار محلی"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={kind === id}
              onClick={() => setKind(id)}
              className={`min-h-10 flex-1 rounded-lg px-3 text-xs font-semibold transition ${kind === id ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {kind === "faq" && (
          <div className="mt-3 space-y-2">
            {rows.map((row, index) => (
              <div key={index} className="rounded-xl border border-ink-200 p-2.5">
                <input
                  value={row.q}
                  onChange={(event) => setRows(rows.map((item, i) => (i === index ? { ...item, q: event.target.value } : item)))}
                  placeholder="پرسش"
                  data-testid={`faq-q-${index}`}
                  className="w-full rounded-lg border border-ink-200 px-2.5 py-2 text-xs outline-none focus:border-brand-400"
                />
                <textarea
                  value={row.a}
                  onChange={(event) => setRows(rows.map((item, i) => (i === index ? { ...item, a: event.target.value } : item)))}
                  placeholder="پاسخ"
                  rows={2}
                  data-testid={`faq-a-${index}`}
                  className="mt-1.5 w-full rounded-lg border border-ink-200 px-2.5 py-2 text-xs outline-none focus:border-brand-400"
                />
              </div>
            ))}
            <button type="button" onClick={() => setRows([...rows, { q: "", a: "" }])} className="min-h-10 w-full rounded-lg border border-dashed border-ink-300 text-xs font-semibold text-ink-500 hover:border-brand-300 hover:text-brand-600">
              + پرسش دیگر
            </button>
          </div>
        )}

        {kind === "howto" && (
          <div className="mt-3 space-y-2">
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="عنوان آموزش" data-testid="howto-name" className="w-full rounded-lg border border-ink-200 px-2.5 py-2 text-xs outline-none focus:border-brand-400" />
            {steps.map((step, index) => (
              <input
                key={index}
                value={step}
                onChange={(event) => setSteps(steps.map((item, i) => (i === index ? event.target.value : item)))}
                placeholder={`گام ${index + 1}`}
                data-testid={`howto-step-${index}`}
                className="w-full rounded-lg border border-ink-200 px-2.5 py-2 text-xs outline-none focus:border-brand-400"
              />
            ))}
            <button type="button" onClick={() => setSteps([...steps, ""])} className="min-h-10 w-full rounded-lg border border-dashed border-ink-300 text-xs font-semibold text-ink-500 hover:border-brand-300 hover:text-brand-600">
              + گام دیگر
            </button>
          </div>
        )}

        {kind === "local" && (
          <div className="mt-3 space-y-2">
            {([
              ["name", "نام کسب‌وکار"],
              ["address", "نشانی"],
              ["city", "شهر"],
              ["phone", "تلفن"],
              ["url", "وب‌سایت"],
            ] as const).map(([key, label]) => (
              <input
                key={key}
                value={local[key]}
                onChange={(event) => setLocal({ ...local, [key]: event.target.value })}
                placeholder={label}
                data-testid={`local-${key}`}
                className="w-full rounded-lg border border-ink-200 px-2.5 py-2 text-xs outline-none focus:border-brand-400"
              />
            ))}
          </div>
        )}
      </ToolPanel>

      <ToolPanel title="کد JSON-LD">
        {empty ? (
          <ResultHint>فیلدهای لازم را پر کنید تا کد ساخته شود.</ResultHint>
        ) : (
          <div data-testid="schema-output">
            <div className="flex justify-end">
              <CopyButton value={output} label="کپی کد" />
            </div>
            <pre dir="ltr" className="mt-1 max-h-96 overflow-auto rounded-xl bg-ink-900 p-3 text-left font-mono text-[11px] leading-5 text-ink-100">
              {output}
            </pre>
            <p className="mt-2 text-[11px] leading-5 text-ink-500">
              این کد را داخل یک تگ <code className="font-mono">&lt;script type=&quot;application/ld+json&quot;&gt;</code> در صفحه بگذارید.
              محتوایی که در Schema می‌نویسید باید روی صفحه هم دیده شود؛ گوگل مارک‌آپ پنهان را نمی‌پذیرد.
            </p>
          </div>
        )}
      </ToolPanel>
    </div>
  );
}

/* ───────────────────── helper ───────────────────── */

function Text({
  label,
  value,
  onChange,
  placeholder,
  rows,
  ltr,
  testId,
  counter,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  ltr?: boolean;
  testId: string;
  counter?: { length: number; min: number; max: number };
}) {
  const className =
    "w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100" +
    (ltr ? " text-left" : "");
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-semibold text-ink-600">{label}</label>
        {counter && (
          <span className={`text-[10px] font-bold ${counter.length > counter.max ? "text-rose-600" : counter.length >= counter.min ? "text-emerald-600" : "text-ink-400"}`}>
            {counter.length} / {counter.max}
          </span>
        )}
      </div>
      {rows ? (
        <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} dir={ltr ? "ltr" : undefined} data-testid={testId} className={className} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} dir={ltr ? "ltr" : undefined} data-testid={testId} className={className} />
      )}
    </div>
  );
}
