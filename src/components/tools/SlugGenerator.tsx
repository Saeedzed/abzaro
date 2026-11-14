"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { slugify } from "@/lib/text-tools";
import { ToolPanel } from "./shared";
import { cn } from "@/lib/utils";

/**
 * Persian → URL slug. Two modes: transliterated ASCII (safe everywhere) and
 * Persian letters kept (readable in the address bar and in Google results).
 */
export function SlugGenerator() {
  const [input, setInput] = useState("");
  const [separator, setSeparator] = useState("-");
  const [keepPersian, setKeepPersian] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const slug = slugify(input, { keepPersian, separator });
  const persianSlug = slugify(input, { keepPersian: true, separator });

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-4">
      <ToolPanel
        title="عنوان یا جمله را بنویسید"
        description="فاصله‌ها به خط تیره تبدیل می‌شوند و علائم نگارشی حذف می‌شوند."
        icon={<Link2 className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <label htmlFor="slug-input" className="sr-only">
          عنوان برای ساخت اسلاگ
        </label>
        <textarea
          id="slug-input"
          dir="auto"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={3}
          placeholder="چطور یک عکس را به PDF تبدیل کنیم؟"
          data-testid="slug-input"
          className="w-full resize-y rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm leading-7 text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setKeepPersian((value) => !value)}
            aria-pressed={keepPersian}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
              keepPersian
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-ink-200 bg-white text-ink-500 hover:border-brand-300",
            )}
          >
            نگه‌داشتن حروف فارسی در آدرس
          </button>

          <label className="flex items-center gap-2 text-[11px] text-ink-500">
            جداکننده
            <select
              value={separator}
              onChange={(event) => setSeparator(event.target.value)}
              className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-brand-400"
            >
              <option value="-">خط تیره ( - )</option>
              <option value="_">زیرخط ( _ )</option>
            </select>
          </label>
        </div>
      </ToolPanel>

      <div className="grid gap-4 sm:grid-cols-2">
        <ResultCard
          label="اسلاگ انگلیسی (پیشنهادی)"
          hint="سازگار با همهٔ سیستم‌ها و شبکه‌های اجتماعی"
          value={slug}
          testId="slug-output-latin"
          copied={copied === "latin"}
          onCopy={() => void copy(slug, "latin")}
        />
        <ResultCard
          label="اسلاگ فارسی"
          hint="خوانا و قابل‌فهم برای کاربر فارسی‌زبان"
          value={persianSlug}
          testId="slug-output-fa"
          copied={copied === "fa"}
          onCopy={() => void copy(persianSlug, "fa")}
        />
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card">
        <p className="text-xs font-bold text-ink-700">پیش‌نمایش آدرس</p>
        <p
          dir="ltr"
          className="mt-2 overflow-x-auto rounded-xl bg-ink-50 px-3 py-2 text-left text-xs text-ink-600"
        >
          https://abzaro.netlify.app/blog/<span className="font-bold text-brand-700">{slug || "your-post"}</span>
        </p>
      </div>
    </div>
  );
}

function ResultCard({
  label,
  hint,
  value,
  testId,
  copied,
  onCopy,
}: {
  label: string;
  hint: string;
  value: string;
  testId: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card">
      <p className="text-xs font-bold text-ink-700">{label}</p>
      <p className="mt-0.5 text-[11px] text-ink-500">{hint}</p>
      <div className="mt-3 flex items-center gap-2">
        <code
          dir="ltr"
          data-testid={testId}
          className="min-h-9 flex-1 overflow-x-auto rounded-lg bg-ink-50 px-3 py-2 text-left text-xs font-medium text-ink-800"
        >
          {value || "—"}
        </code>
        <button
          type="button"
          onClick={onCopy}
          disabled={!value}
          aria-label={`کپی ${label}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
        >
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
