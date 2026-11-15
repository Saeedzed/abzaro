"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSearch, XCircle } from "lucide-react";
import { analyzePage, SEO_LIMITS, type Severity } from "@/lib/seo";
import { ResultHint, ToolPanel } from "./shared";

const SAMPLE_HTML = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <title>نمونهٔ صفحه برای بررسی سئو</title>
  <meta name="description" content="این یک نمونه است. تگ‌های سئوی صفحه را اینجا بچسبانید تا عنوان، توضیح، تیترها و چگالی کلیدواژه بررسی شود.">
</head>
<body>
  <h1>تیتر اصلی صفحه</h1>
  <p>متن صفحه …</p>
</body>
</html>`;

const SEVERITY_STYLE: Record<Severity, { icon: typeof CheckCircle2; className: string; label: string }> = {
  error: { icon: XCircle, className: "border-rose-200 bg-rose-50 text-rose-800", label: "خطا" },
  warning: { icon: AlertTriangle, className: "border-amber-200 bg-amber-50 text-amber-900", label: "هشدار" },
  ok: { icon: CheckCircle2, className: "border-emerald-200 bg-emerald-50 text-emerald-800", label: "درست" },
};

/**
 * On-page SEO checker. Paste the page source (Ctrl+U → copy) or just the
 * head tags; the analysis is local and instant.
 */
export function SeoAnalyzer() {
  const [html, setHtml] = useState("");
  const [keyword, setKeyword] = useState("");

  const analysis = useMemo(
    () => (html.trim() === "" ? null : analyzePage(html, keyword)),
    [html, keyword],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel title="کد صفحه" icon={<FileSearch className="h-4 w-4 text-brand-600" aria-hidden="true" />}>
        <label htmlFor="seo-html" className="mb-1.5 block text-sm font-semibold text-ink-700">
          سورس HTML صفحه
        </label>
        <textarea
          id="seo-html"
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          placeholder={SAMPLE_HTML}
          rows={12}
          dir="ltr"
          data-testid="seo-html"
          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-left font-mono text-xs leading-6 text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-40 flex-1">
            <label htmlFor="seo-keyword" className="mb-1 block text-xs font-semibold text-ink-600">
              کلیدواژهٔ هدف (اختیاری)
            </label>
            <input
              id="seo-keyword"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="مثلاً: محاسبهٔ حقوق"
              data-testid="seo-keyword"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <button
            type="button"
            onClick={() => setHtml(SAMPLE_HTML)}
            className="min-h-10 rounded-lg border border-ink-200 px-3 text-xs font-semibold text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            نمونه
          </button>
          {html && (
            <button
              type="button"
              onClick={() => {
                setHtml("");
                setKeyword("");
              }}
              className="min-h-10 rounded-lg px-3 text-xs font-semibold text-ink-500 transition hover:bg-ink-100"
            >
              پاک کردن
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] leading-5 text-ink-400">
          سورس صفحه را با Ctrl+U در مرورگر باز کنید و کپی کنید. هیچ‌چیز ارسال نمی‌شود.
        </p>
      </ToolPanel>

      <ToolPanel title="نتیجهٔ بررسی">
        {analysis === null ? (
          <ResultHint>کد صفحه را بچسبانید تا بررسی شود.</ResultHint>
        ) : (
          <div data-testid="seo-result">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5">
              <span className="text-xs font-semibold text-ink-600">امتیاز کلی</span>
              <span
                className={`text-lg font-extrabold ${
                  analysis.score >= 80 ? "text-emerald-600" : analysis.score >= 50 ? "text-amber-600" : "text-rose-600"
                }`}
                data-testid="seo-score"
              >
                {analysis.score}
                <span className="text-xs font-normal text-ink-400"> / ۱۰۰</span>
              </span>
            </div>

            <dl className="mt-3 space-y-2 text-xs">
              <Row label="عنوان (title)" value={`${analysis.title.length} نویسه`} status={analysis.title.status} hint={`محدودهٔ پیشنهادی ${SEO_LIMITS.titleMin}–${SEO_LIMITS.titleMax}`} />
              <Row label="متا دیسکریپشن" value={`${analysis.description.length} نویسه`} status={analysis.description.status} hint={`محدودهٔ پیشنهادی ${SEO_LIMITS.descriptionMin}–${SEO_LIMITS.descriptionMax}`} />
              <Row label="تیتر H1" value={`${analysis.h1Count} عدد`} status={analysis.h1Count === 1 ? "ok" : analysis.h1Count === 0 ? "error" : "warning"} hint="دقیقاً یکی بهتر است" />
              <Row label="تعداد کلمات" value={`${analysis.words}`} status={analysis.words >= SEO_LIMITS.minWordsForLongContent ? "ok" : "warning"} hint="زیر ۳۰۰ کلمه رقابت سخت است" />
              {keyword && (
                <Row
                  label={`کلیدواژهٔ «${keyword}»`}
                  value={`${analysis.keyword.count} بار · ${analysis.keyword.density.toFixed(1)}٪`}
                  status={analysis.keyword.count === 0 ? "warning" : analysis.keyword.density > 3 ? "warning" : "ok"}
                  hint={`در عنوان: ${analysis.keyword.inTitle ? "بله" : "نه"} · در توضیح: ${analysis.keyword.inDescription ? "بله" : "نه"}`}
                />
              )}
            </dl>

            <ul className="mt-3 space-y-2">
              {analysis.issues.length === 0 ? (
                <li className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  هیچ ایرادی پیدا نشد.
                </li>
              ) : (
                analysis.issues.map((issue) => {
                  const style = SEVERITY_STYLE[issue.severity];
                  const Icon = style.icon;
                  return (
                    <li key={issue.id} className={`rounded-xl border px-3 py-2.5 ${style.className}`}>
                      <p className="flex items-start gap-1.5 text-xs font-bold">
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {issue.title}
                      </p>
                      <p className="mt-1 text-[11px] leading-5 opacity-90">{issue.detail}</p>
                      {issue.fix && <p className="mt-1 text-[11px] leading-5 font-medium">← {issue.fix}</p>}
                    </li>
                  );
                })
              )}
            </ul>

            {analysis.headings.length > 0 && (
              <details className="mt-3 rounded-xl border border-ink-200 bg-white px-3 py-2">
                <summary className="cursor-pointer text-xs font-bold text-ink-700">
                  ساختار تیترها ({analysis.headings.length})
                </summary>
                <ul className="mt-2 space-y-1" data-testid="seo-headings">
                  {analysis.headings.map((heading, index) => (
                    <li
                      key={`${heading.level}-${index}`}
                      className="text-[11px] leading-5 text-ink-600"
                      style={{ paddingInlineStart: `${(heading.level - 1) * 10}px` }}
                    >
                      <span className="font-mono text-brand-600">H{heading.level}</span> {heading.text}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </ToolPanel>
    </div>
  );
}

function Row({ label, value, status, hint }: { label: string; value: string; status: Severity; hint?: string }) {
  const color = status === "ok" ? "text-emerald-600" : status === "warning" ? "text-amber-600" : "text-rose-600";
  return (
    <div className="flex items-start justify-between gap-2 border-b border-ink-100 pb-1.5 last:border-0">
      <div>
        <dt className="font-semibold text-ink-700">{label}</dt>
        {hint && <p className="text-[10px] text-ink-400">{hint}</p>}
      </div>
      <dd className={`shrink-0 font-bold ${color}`}>{value}</dd>
    </div>
  );
}
