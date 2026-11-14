"use client";

import { useMemo, useState } from "react";
import { Check, Copy, RefreshCw, Type } from "lucide-react";
import { persianLorem } from "@/lib/text-tools";
import { toPersianDigits } from "@/lib/persian";
import { ToolPanel } from "./shared";

/** متن ساختگی فارسی (لورم ایپسوم) برای طراحی و تست. */
export function PersianLorem() {
  const [paragraphs, setParagraphs] = useState(3);
  const [sentences, setSentences] = useState(4);
  const [seed, setSeed] = useState(1404);
  const [copied, setCopied] = useState(false);

  const text = useMemo(
    () => persianLorem({ paragraphs, sentencesPerParagraph: sentences, seed }),
    [paragraphs, sentences, seed],
  );

  const wordCount = useMemo(() => text.split(/\s+/).filter(Boolean).length, [text]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the text stays selectable.
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="تنظیمات"
        description="تعداد پاراگراف و جمله‌ها"
        icon={<Type className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-ink-700">
              <label htmlFor="lorem-paragraphs">پاراگراف</label>
              <span className="text-brand-700">{toPersianDigits(paragraphs)}</span>
            </div>
            <input
              id="lorem-paragraphs"
              type="range"
              min={1}
              max={10}
              value={paragraphs}
              onChange={(event) => setParagraphs(Number(event.target.value))}
              className="mt-1 w-full accent-brand-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-ink-700">
              <label htmlFor="lorem-sentences">جمله در هر پاراگراف</label>
              <span className="text-brand-700">{toPersianDigits(sentences)}</span>
            </div>
            <input
              id="lorem-sentences"
              type="range"
              min={1}
              max={10}
              value={sentences}
              onChange={(event) => setSentences(Number(event.target.value))}
              className="mt-1 w-full accent-brand-600"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2">
            <div className="text-[11px] text-ink-500">
              {toPersianDigits(wordCount)} کلمه · {toPersianDigits(paragraphs)} پاراگراف
            </div>
            <button
              type="button"
              onClick={() => setSeed(Math.floor(Math.random() * 100000))}
              data-testid="lorem-refresh"
              className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-brand-700 shadow-card transition hover:bg-brand-50"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              متن جدید
            </button>
          </div>

          <p className="rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-6 text-ink-500">
            این متن ساختگی است و معنی واقعی ندارد؛ برای پر کردن قالب، طراحی و
            تست طول متن فارسی استفاده می‌شود.
          </p>
        </div>
      </ToolPanel>

      <ToolPanel
        title="متن آماده"
        description="آمادهٔ کپی در طرح"
        icon={<Type className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        action={
          <button
            type="button"
            onClick={copy}
            data-testid="lorem-copy"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-brand-700"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "کپی شد" : "کپی متن"}
          </button>
        }
      >
        <div
          data-testid="lorem-output"
          className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-ink-200 bg-ink-50/40 p-3 text-sm leading-8 text-ink-800"
        >
          {text}
        </div>
      </ToolPanel>
    </div>
  );
}
