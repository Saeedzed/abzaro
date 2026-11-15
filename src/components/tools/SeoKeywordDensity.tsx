"use client";

import { useMemo, useState } from "react";
import { Percent } from "lucide-react";
import { countKeyword, countWords, keywordDensity } from "@/lib/seo";
import { ResultHint, ToolPanel, formatFa } from "./shared";

/** Keyword density with the same whole-word counting the analyzer uses. */
export function KeywordDensitySeo() {
  const [text, setText] = useState("");
  const [keyword, setKeyword] = useState("");

  const stats = useMemo(() => {
    const words = countWords(text);
    const count = countKeyword(text, keyword);
    return { words, count, density: keywordDensity(text, keyword) };
  }, [text, keyword]);

  const level =
    stats.density === 0 ? "idle" : stats.density > 3 ? "high" : stats.density < 0.5 ? "low" : "ok";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel title="متن و کلیدواژه" icon={<Percent className="h-4 w-4 text-brand-600" aria-hidden="true" />}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={10}
          placeholder="متن صفحه را اینجا بچسبانید…"
          data-testid="density-text"
          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm leading-7 outline-none placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="کلیدواژهٔ هدف"
          data-testid="density-keyword"
          className="mt-2 w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
      </ToolPanel>
      <ToolPanel title="نتیجه">
        {text.trim() === "" || keyword.trim() === "" ? (
          <ResultHint>متن و کلیدواژه را وارد کنید.</ResultHint>
        ) : (
          <div data-testid="density-result">
            <p className="text-center text-3xl font-extrabold text-ink-900">
              {formatFa(stats.density, 2)}
              <span className="text-base font-bold text-ink-400">٪</span>
            </p>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between border-b border-ink-100 pb-1.5">
                <dt className="text-ink-600">تعداد کلمات متن</dt>
                <dd className="font-bold text-ink-800">{formatFa(stats.words)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-600">تکرار کلیدواژه</dt>
                <dd className="font-bold text-ink-800">{formatFa(stats.count)} بار</dd>
              </div>
            </dl>
            <p
              className={`mt-3 rounded-xl border px-3 py-2.5 text-[11px] leading-5 ${
                level === "high"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : level === "low"
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {level === "high"
                ? "چگالی بالای ۳٪ است؛ این بوی keyword stuffing می‌دهد. بخشی از تکرارها را با ضمیر یا مترادف عوض کنید."
                : level === "low"
                  ? "چگالی زیر ۰٫۵٪ است؛ کلیدواژه جای بیشتری در متن می‌خواهد، مخصوصاً در تیتر و پاراگراف اول."
                  : "چگالی در محدودهٔ طبیعی (۰٫۵ تا ۳ درصد) است."}
            </p>
            <p className="mt-2 text-[11px] leading-5 text-ink-400">
              شمارش کلمه‌به‌کلمه است؛ «مالیات» داخل «مالیاتی» شمرده نمی‌شود.
            </p>
          </div>
        )}
      </ToolPanel>
    </div>
  );
}
