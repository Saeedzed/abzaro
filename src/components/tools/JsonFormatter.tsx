"use client";

import { useMemo, useState } from "react";
import { Braces, Check, Copy, Minimize2, SortAsc, Wand2 } from "lucide-react";
import { bytesToPersian, formatJson, minifyJson, sortJsonKeys, type JsonIndent } from "@/lib/codec";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

const SAMPLE = `{
  "name": "ابزارو",
  "tools": 12,
  "tags": ["متن", "اعداد", "تصاویر"],
  "free": true
}`;

const INDENTS: Array<{ id: JsonIndent; label: string }> = [
  { id: 2, label: "۲ فاصله" },
  { id: 4, label: "۴ فاصله" },
  { id: "tab", label: "Tab" },
];

/**
 * JSON formatter, validator and minifier.
 *
 * Parsing runs in the browser with `JSON.parse`, so huge documents stay on the
 * visitor's machine. Errors are translated to a short Persian sentence with
 * line/column detail.
 */
export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<JsonIndent>(2);
  const [repair, setRepair] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<{ line?: number; column?: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"format" | "minify" | "sort" | null>(null);

  const stats = useMemo(() => {
    if (!output) return null;
    const json = formatJson(output, indent);
    return json.error ? null : (json.meta ?? null);
  }, [output, indent]);

  function apply(next: "format" | "minify" | "sort") {
    const result =
      next === "minify"
        ? minifyJson(input, repair)
        : next === "sort"
          ? sortJsonKeys(input)
          : formatJson(input, indent, repair);

    setMode(next);
    if (result.error) {
      setError(result.error);
      setPosition({ line: result.line, column: result.column });
      setOutput("");
      return;
    }
    setError(null);
    setPosition(null);
    setOutput(result.formatted);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const hasInput = input.trim() !== "";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => apply("format")}
          data-testid="json-format"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
        >
          <Braces className="h-3.5 w-3.5" aria-hidden="true" />
          مرتب‌سازی
        </button>
        <button
          type="button"
          onClick={() => apply("minify")}
          data-testid="json-minify"
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
        >
          <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
          فشرده کردن
        </button>
        <button
          type="button"
          onClick={() => apply("sort")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
        >
          <SortAsc className="h-3.5 w-3.5" aria-hidden="true" />
          مرتب‌سازی کلیدها
        </button>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100">
          <input
            type="checkbox"
            checked={repair}
            onChange={(event) => setRepair(event.target.checked)}
            className="h-3.5 w-3.5 accent-brand-600"
            data-testid="json-repair"
          />
          <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
          تعمیر خودکار
        </label>

        <div className="ms-auto flex items-center gap-1.5">
          {INDENTS.map((item) => (
            <button
              key={String(item.id)}
              type="button"
              onClick={() => {
                setIndent(item.id);
                if (hasInput && mode === "format") {
                  const result = formatJson(input, item.id, repair);
                  setOutput(result.formatted);
                  setError(result.error);
                }
              }}
              aria-pressed={indent === item.id}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition",
                indent === item.id
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-ink-200 text-ink-600 hover:bg-ink-100",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="json-input" className="text-xs font-semibold text-ink-700">
              ورودی
            </label>
            <button
              type="button"
              onClick={() => {
                setInput(SAMPLE);
                setOutput("");
                setError(null);
              }}
              className="text-[11px] font-medium text-brand-700 underline-offset-2 hover:underline"
            >
              درج نمونه
            </button>
          </div>
          <textarea
            id="json-input"
            dir="ltr"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError(null);
              setPosition(null);
            }}
            rows={16}
            spellCheck={false}
            placeholder='{"name": "ابزارو", "tools": 12}'
            data-testid="json-input"
            className="w-full resize-y rounded-xl border border-ink-200 bg-white p-3 font-mono text-[11px] leading-5 text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-700">خروجی</span>
            <button
              type="button"
              onClick={() => void copy()}
              disabled={!output}
              data-testid="json-copy"
              className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2 py-1 text-[11px] font-semibold text-ink-700 transition hover:bg-ink-100 disabled:opacity-40"
            >
              {copied ? <Check className="h-3 w-3" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
              {copied ? "کپی شد" : "کپی"}
            </button>
          </div>
          <textarea
            dir="ltr"
            readOnly
            value={output}
            rows={16}
            spellCheck={false}
            aria-label="خروجی JSON"
            data-testid="json-output"
            placeholder="خروجی اینجا نمایش داده می‌شود…"
            className="code-pane w-full resize-y rounded-xl border border-ink-200 bg-ink-50 p-3 font-mono text-[11px] leading-5 text-ink-900 placeholder:text-ink-300"
          />
        </div>
      </div>

      <div className="mt-3" aria-live="polite">
        {error ? (
          <div
            role="alert"
            data-testid="json-error"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
          >
            <span className="me-1.5">❌</span>
            {error}
            {position?.line ? (
              <span className="ms-1 text-red-600">
                (خط {toPersianDigits(position.line)}
                {position.column ? `، ستون ${toPersianDigits(position.column)}` : ""})
              </span>
            ) : null}
          </div>
        ) : output ? (
          <div
            data-testid="json-valid"
            className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800"
          >
            <span>
                <span className="me-1.5">✅</span>
                JSON معتبر است
              </span>
            {stats && (
              <>
                <span>کلیدها: {toPersianDigits(stats.keys)}</span>
                <span>آرایه‌ها: {toPersianDigits(stats.arrays)}</span>
                <span>عمق: {toPersianDigits(stats.depth)}</span>
                <span>حجم: {toPersianDigits(bytesToPersian(stats.bytes))}</span>
              </>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-ink-400">
            متن JSON را در کادر ورودی بچسبانید و دکمه‌ها را بزنید. پردازش کاملاً
            در مرورگر انجام می‌شود.
          </p>
        )}
      </div>
    </div>
  );
}
