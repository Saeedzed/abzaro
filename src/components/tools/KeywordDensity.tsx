"use client";

import { useMemo, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { keywordDensity } from "@/lib/text-tools";
import { ToolPanel, formatFa } from "./shared";
import { cn } from "@/lib/utils";

const SAMPLE = `تبدیل عکس به PDF یکی از پرکاربردترین ابزارهای آنلاین است.
با ابزار تبدیل عکس به PDF می‌توانید چند تصویر را در یک فایل PDF ادغام کنید.
این ابزار عکس به PDF بدون نصب و بدون ثبت‌نام کار می‌کند و فایل شما را آپلود نمی‌کند.`;

/**
 * Keyword frequency + density for Persian content. Half-spaces are folded, so
 * «می‌شود» and «میشود» count as one word; stop words are excluded so the list
 * shows the terms that actually matter for SEO.
 */
export function KeywordDensity() {
  const [input, setInput] = useState("");
  const [dropStopWords, setDropStopWords] = useState(true);
  const [limit, setLimit] = useState(15);

  const result = useMemo(
    () => keywordDensity(input, { dropStopWords, limit, minLength: 2 }),
    [input, dropStopWords, limit],
  );

  const max = result.keywords[0]?.count ?? 1;
  const hasInput = input.trim().length > 0;

  return (
    <div className="space-y-4">
      <ToolPanel
        title="متن را وارد کنید"
        description="تکرار کلمات و چگالی آن‌ها (درصد از کل کلمات) محاسبه می‌شود."
        icon={<BarChart3 className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        action={
          <button
            type="button"
            onClick={() => setInput(SAMPLE)}
            className="rounded-lg border border-ink-200 px-2.5 py-1 text-[11px] font-medium text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            نمونه
          </button>
        }
      >
        <label htmlFor="kd-input" className="sr-only">
          متن برای تحلیل کلمات کلیدی
        </label>
        <textarea
          id="kd-input"
          dir="auto"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={8}
          placeholder={SAMPLE}
          data-testid="kd-input"
          className="w-full resize-y rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm leading-7 text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDropStopWords((value) => !value)}
            aria-pressed={dropStopWords}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
              dropStopWords
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-ink-200 bg-white text-ink-500 hover:border-brand-300",
            )}
          >
            حذف کلمات ربط (و، در، به…)
          </button>

          <label className="ms-auto flex items-center gap-2 text-[11px] text-ink-500">
            تعداد نمایش
            <select
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-brand-400"
            >
              {[10, 15, 25, 50].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
      </ToolPanel>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-center shadow-card">
          <p className="text-2xl font-extrabold text-ink-900" data-testid="kd-total">
            {formatFa(result.totalWords, 0)}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-ink-500">کل کلمات</p>
        </div>
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-center shadow-card">
          <p className="text-2xl font-extrabold text-brand-700">{formatFa(result.uniqueWords, 0)}</p>
          <p className="mt-0.5 text-[11px] font-medium text-ink-500">کلمات یکتا</p>
        </div>
      </div>

      <ToolPanel
        title="کلمات پرتکرار"
        icon={<TrendingUp className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        {!hasInput ? (
          <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-6 text-center text-sm text-ink-400">
            متن را وارد کنید تا تحلیل کلمات نمایش داده شود.
          </p>
        ) : result.keywords.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-6 text-center text-sm text-ink-400">
            کلمهٔ قابل‌شمارشی پیدا نشد. متن طولانی‌تری امتحان کنید.
          </p>
        ) : (
          <ul className="space-y-2" data-testid="kd-list">
            {result.keywords.map((keyword, index) => (
              <li key={keyword.word} className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-[11px] font-bold text-ink-400">
                  {formatFa(index + 1, 0)}
                </span>
                <span className="w-24 shrink-0 truncate text-xs font-medium text-ink-800 sm:w-32">
                  {keyword.word}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                  <span
                    className="block h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.max(6, (keyword.count / max) * 100)}%` }}
                  />
                </span>
                <span className="w-10 shrink-0 text-end text-xs font-bold text-ink-900">
                  {formatFa(keyword.count, 0)}
                </span>
                <span className="w-14 shrink-0 text-end text-[11px] text-ink-500">
                  {formatFa(keyword.density * 100, 1)}٪
                </span>
              </li>
            ))}
          </ul>
        )}
      </ToolPanel>
    </div>
  );
}
