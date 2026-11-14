"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Check, Copy, Link2 } from "lucide-react";
import { decodeUrl, encodeUrl, type UrlMode } from "@/lib/codec";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

const MODES: Array<{ id: UrlMode; label: string; hint: string }> = [
  { id: "component", label: "کامل", hint: "همهٔ کاراکترهای خاص" },
  { id: "uri", label: "لینک", hint: "/ و : دست‌نخورده" },
  { id: "safe", label: "امن", hint: "حتی / هم کد می‌شود" },
];

const SAMPLE = "https://abzaro.netlify.app/tools?q=سلام دنیا&lang=fa";

/**
 * URL encoder / decoder.
 *
 * Three modes mirror the JavaScript API: `encodeURIComponent` (default),
 * `encodeURI` and a URL-safe variant that also escapes `/`.
 */
export function UrlEncoder() {
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [mode, setMode] = useState<UrlMode>("component");
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (input === "") return { value: "", error: null };
    return direction === "encode" ? encodeUrl(input, mode) : decodeUrl(input, mode);
  }, [input, direction, mode]);

  async function copy() {
    if (!result.value) return;
    try {
      await navigator.clipboard.writeText(result.value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-ink-200 p-0.5">
          {(
            [
              { id: "encode" as const, label: "کدگذاری" },
              { id: "decode" as const, label: "رمزگشایی" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDirection(item.id)}
              aria-pressed={direction === item.id}
              data-testid={`url-mode-${item.id}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                direction === item.id ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-100",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setDirection((current) => (current === "encode" ? "decode" : "encode"));
            setInput(result.value || input);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
          جابه‌جایی
        </button>

        <button
          type="button"
          onClick={() => setInput(SAMPLE)}
          className="ms-auto text-[11px] font-medium text-brand-700 underline-offset-2 hover:underline"
        >
          درج نمونه
        </button>
      </div>

      <fieldset className="mt-3">
        <legend className="mb-1.5 text-xs font-semibold text-ink-700">حالت</legend>
        <div className="flex gap-2">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              aria-pressed={mode === item.id}
              className={cn(
                "flex-1 rounded-lg border px-2 py-2 text-[11px] font-semibold transition",
                mode === item.id
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-ink-200 text-ink-600 hover:bg-ink-100",
              )}
            >
              {item.label}
              <span className="mt-0.5 block text-[10px] font-normal opacity-70">{item.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div>
          <label htmlFor="url-input" className="mb-1.5 block text-xs font-semibold text-ink-700">
            {direction === "encode" ? "لینک یا متن" : "متن کدگذاری‌شده"}
          </label>
          <textarea
            id="url-input"
            dir="ltr"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={10}
            spellCheck={false}
            placeholder={
              direction === "encode"
                ? "https://example.com/?q=سلام دنیا"
                : "https%3A%2F%2Fexample.com%2F%3Fq%3D..."
            }
            data-testid="url-input"
            className="w-full resize-y rounded-xl border border-ink-200 bg-white p-3 font-mono text-[11px] leading-5 text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-700">خروجی</span>
            <button
              type="button"
              onClick={() => void copy()}
              disabled={!result.value}
              data-testid="url-copy"
              className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2 py-1 text-[11px] font-semibold text-ink-700 transition hover:bg-ink-100 disabled:opacity-40"
            >
              {copied ? <Check className="h-3 w-3" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
              {copied ? "کپی شد" : "کپی"}
            </button>
          </div>
          <textarea
            dir="ltr"
            readOnly
            value={result.value}
            rows={10}
            spellCheck={false}
            aria-label="خروجی"
            data-testid="url-output"
            placeholder="خروجی اینجا نمایش داده می‌شود…"
            className="code-pane w-full resize-y rounded-xl border border-ink-200 bg-ink-50 p-3 font-mono text-[11px] leading-5 text-ink-900 placeholder:text-ink-300"
          />
        </div>
      </div>

      <div className="mt-3" aria-live="polite">
        {result.error ? (
          <p
            role="alert"
            data-testid="url-error"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
          >
            <span className="me-1.5">❌</span>
            {result.error}
          </p>
        ) : result.value ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
            <span className="inline-flex items-center gap-1">
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              آماده است
            </span>
            <span>{toPersianDigits(result.value.length)} کاراکتر</span>
          </div>
        ) : (
          <p className="text-[11px] text-ink-400">
            لینک یا متن را وارد کنید؛ نتیجه هم‌زمان نمایش داده می‌شود.
          </p>
        )}
      </div>
    </div>
  );
}
