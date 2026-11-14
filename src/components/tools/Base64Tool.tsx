"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Check, Copy, Download } from "lucide-react";
import { decodeBase64, encodeBase64, looksLikeText } from "@/lib/codec";
import { downloadBlob } from "@/lib/image";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

const SAMPLE = "ابزارو — ابزارهای کاربردی، سریع و رایگان";

/**
 * Base64 encoder / decoder for text. Handles Persian (UTF-8) correctly, which
 * a naive `btoa` call would mangle.
 */
export function Base64Tool() {
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [urlSafe, setUrlSafe] = useState(false);

  const result = useMemo(() => {
    if (input === "") return { output: "", error: null };
    if (direction === "encode") {
      try {
        let value = encodeBase64(input);
        if (urlSafe) value = value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        return { output: value, error: null };
      } catch {
        return { output: "", error: "کدگذاری این متن ممکن نشد." };
      }
    }
    const decoded = decodeBase64(input);
    return { output: decoded.text, error: decoded.error };
  }, [input, direction, urlSafe]);

  const binaryWarning =
    direction === "decode" && result.output !== "" && !looksLikeText(result.output)
      ? "خروجی شامل کاراکترهای غیرمتنی است — احتمالاً این Base64 مربوط به یک فایل (مثل تصویر) است، نه متن."
      : null;

  function swap() {
    setDirection((current) => (current === "encode" ? "decode" : "encode"));
    setInput(result.output || input);
  }

  async function copy() {
    if (!result.output) return;
    try {
      await navigator.clipboard.writeText(result.output);
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
              data-testid={`base64-mode-${item.id}`}
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
          onClick={swap}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
          جابه‌جایی
        </button>

        {direction === "encode" && (
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(event) => setUrlSafe(event.target.checked)}
              className="h-3.5 w-3.5 accent-brand-600"
            />
            URL-safe
          </label>
        )}

        <button
          type="button"
          onClick={() => setInput(SAMPLE)}
          className="ms-auto text-[11px] font-medium text-brand-700 underline-offset-2 hover:underline"
        >
          درج نمونه
        </button>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div>
          <label htmlFor="base64-input" className="mb-1.5 block text-xs font-semibold text-ink-700">
            {direction === "encode" ? "متن" : "متن Base64"}
          </label>
          <textarea
            id="base64-input"
            dir="ltr"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={12}
            spellCheck={false}
            placeholder={direction === "encode" ? "متن خود را بنویسید…" : "2KfYqNiy2KfYsdmI"}
            data-testid="base64-tool-input"
            className="w-full resize-y rounded-xl border border-ink-200 bg-white p-3 font-mono text-[11px] leading-5 text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-700">
              {direction === "encode" ? "Base64" : "متن"}
            </span>
            <div className="flex items-center gap-1">
              {result.output && (
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      new Blob([result.output], { type: "text/plain;charset=utf-8" }),
                      direction === "encode" ? "base64.txt" : "decoded.txt",
                    )
                  }
                  aria-label="دانلود خروجی"
                  className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2 py-1 text-[11px] font-semibold text-ink-700 transition hover:bg-ink-100"
                >
                  <Download className="h-3 w-3" aria-hidden="true" />
                  دانلود
                </button>
              )}
              <button
                type="button"
                onClick={() => void copy()}
                disabled={!result.output}
                data-testid="base64-tool-copy"
                className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2 py-1 text-[11px] font-semibold text-ink-700 transition hover:bg-ink-100 disabled:opacity-40"
              >
                {copied ? <Check className="h-3 w-3" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
                {copied ? "کپی شد" : "کپی"}
              </button>
            </div>
          </div>
          <textarea
            dir="ltr"
            readOnly
            value={result.output}
            rows={12}
            spellCheck={false}
            aria-label="خروجی"
            data-testid="base64-tool-output"
            placeholder="خروجی اینجا نمایش داده می‌شود…"
            className="code-pane w-full resize-y rounded-xl border border-ink-200 bg-ink-50 p-3 font-mono text-[11px] leading-5 text-ink-900 placeholder:text-ink-300"
          />
        </div>
      </div>

      <div className="mt-3" aria-live="polite">
        {result.error ? (
          <p
            role="alert"
            data-testid="base64-tool-error"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
          >
            <span className="me-1.5">❌</span>
            {result.error}
          </p>
        ) : result.output ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
            <span>
              <span className="me-1.5">✅</span>
              آماده است
            </span>
            <span>{toPersianDigits(result.output.length)} کاراکتر</span>
            {binaryWarning && <span className="text-amber-700">
                <span className="me-1.5">⚠️</span>
                {binaryWarning}
              </span>}
          </div>
        ) : (
          <p className="text-[11px] text-ink-400">
            متن را وارد کنید؛ نتیجه هم‌زمان نمایش داده می‌شود. همه‌چیز در مرورگر
            شما پردازش می‌شود.
          </p>
        )}
      </div>
    </div>
  );
}
