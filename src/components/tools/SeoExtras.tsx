"use client";

import { useMemo, useState } from "react";
import { Image as ImageIcon, Link as LinkIcon, Link2 } from "lucide-react";
import { ResultHint, ToolPanel } from "./shared";

/* ─────────────── سئوی تصاویر ─────────────── */

interface ImgTag {
  src: string;
  alt: string;
}

/** Pull `<img>` tags out of HTML — attributes in any order. */
export function parseImages(html: string): ImgTag[] {
  return [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => {
    const tag = match[0];
    const src = tag.match(/\bsrc\s*=\s*["']([^"']*)["']/i)?.[1] ?? "";
    const alt = tag.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1] ?? "";
    return { src, alt };
  });
}

/** Why an alt text is weak — the same rules a human reviewer would apply. */
export function altVerdict(alt: string, src: string): { level: "ok" | "warning" | "error"; note: string } {
  const file = src.split("/").pop() ?? "";
  if (alt.trim() === "") {
    return { level: "error", note: "alt ندارد؛ برای screen reader و تصاویر گوگل نامرئی است." };
  }
  if (/^(image|img|photo|picture|تصویر|عکس)[\d\s._-]*$/i.test(alt.trim())) {
    return { level: "error", note: "alt معنادار نیست («تصویر» یا «image» چیزی به گوگل نمی‌گوید)." };
  }
  if (alt.trim() === file) {
    return { level: "warning", note: "alt همان نام فایل است؛ آن را به زبان طبیعی بنویسید." };
  }
  if (alt.length < 5) {
    return { level: "warning", note: "alt خیلی کوتاه است." };
  }
  if (alt.length > 125) {
    return { level: "warning", note: "alt بلندتر از ۱۲۵ نویسه است؛ خلاصه‌اش کنید." };
  }
  return { level: "ok", note: "درست است." };
}

export function ImageSeoChecker() {
  const [html, setHtml] = useState("");
  const images = useMemo(() => (html.trim() ? parseImages(html) : null), [html]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel title="کد HTML تصاویر" icon={<ImageIcon className="h-4 w-4 text-brand-600" aria-hidden="true" />}>
        <textarea
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          rows={12}
          dir="ltr"
          data-testid="images-html"
          placeholder={'<img src="/photo.jpg" alt="توضیح تصویر">'}
          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-left font-mono text-xs leading-6 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
      </ToolPanel>
      <ToolPanel title="نتیجه">
        {images === null ? (
          <ResultHint>کد تصاویر صفحه را بچسبانید.</ResultHint>
        ) : images.length === 0 ? (
          <ResultHint>هیچ تگ img در کد پیدا نشد.</ResultHint>
        ) : (
          <ul className="space-y-2" data-testid="images-result">
            {images.map((img, index) => {
              const verdict = altVerdict(img.alt, img.src);
              return (
                <li
                  key={index}
                  className={`rounded-xl border px-3 py-2 text-xs ${
                    verdict.level === "ok"
                      ? "border-emerald-200 bg-emerald-50"
                      : verdict.level === "warning"
                        ? "border-amber-200 bg-amber-50"
                        : "border-rose-200 bg-rose-50"
                  }`}
                >
                  <p dir="ltr" className="truncate text-left font-mono text-[10px] text-ink-500">{img.src || "(بدون src)"}</p>
                  <p className="mt-0.5 font-semibold text-ink-800" dir="auto">{img.alt || "(alt ندارد)"}</p>
                  <p className="mt-0.5 text-[11px] leading-5 opacity-90">{verdict.note}</p>
                </li>
              );
            })}
            <li className="rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-5 text-ink-500">
              {images.filter((img) => img.alt.trim() === "").length} تصویر بدون alt ·{" "}
              {images.filter((img) => altVerdict(img.alt, img.src).level !== "ok").length} تصویر نیازمند اصلاح
            </li>
          </ul>
        )}
      </ToolPanel>
    </div>
  );
}

/* ─────────────── تحلیل اسلاگ ─────────────── */

/** Very small Persian→Latin transliteration, enough for readable slugs. */
const TRANSLITERATION: Record<string, string> = {
  آ: "a", ا: "a", ب: "b", پ: "p", ت: "t", ث: "s", ج: "j", چ: "ch", ح: "h", خ: "kh",
  د: "d", ذ: "z", ر: "r", ز: "z", ژ: "zh", س: "s", ش: "sh", ص: "s", ض: "z", ط: "t",
  ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "gh", ک: "k", گ: "g", ل: "l", م: "m",
  ن: "n", و: "v", ه: "h", ی: "y", ء: "", أ: "a", إ: "e", ؤ: "o", ئ: "y", ة: "h",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\u200c\u200f\u200e]/g, "")
    .split("")
    .map((char) => TRANSLITERATION[char] ?? char)
    .join("")
    .replace(/['’"«»]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function SlugAnalyzer() {
  const [value, setValue] = useState("");
  const slug = useMemo(() => slugify(value), [value]);
  const persianChars = [...slug].filter((char) => /[\u0600-\u06FF]/.test(char)).length;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel title="آدرس یا عنوان" icon={<LinkIcon className="h-4 w-4 text-brand-600" aria-hidden="true" />}>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="مثلاً: محاسبه حقوق ۱۴۰۴"
          data-testid="slug-input"
          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
        <p className="mt-2 text-[11px] leading-5 text-ink-400">
          حروف فارسی به لاتین تبدیل می‌شوند تا آدرس خوانا و قابل اشتراک باشد.
        </p>
      </ToolPanel>
      <ToolPanel title="اسلاگ پیشنهادی">
        {value.trim() === "" ? (
          <ResultHint>عنوان یا آدرس را وارد کنید.</ResultHint>
        ) : (
          <div data-testid="slug-result">
            <p dir="ltr" className="break-all rounded-xl bg-ink-900 px-3 py-2.5 text-left font-mono text-xs text-emerald-300">
              /{slug}
            </p>
            <ul className="mt-2 space-y-1 text-[11px] leading-5">
              <li className={slug.length <= 75 ? "text-emerald-600" : "text-rose-600"}>
                طول: {slug.length} نویسه {slug.length <= 75 ? "(مناسب)" : "(بلند؛ زیر ۷۵ نویسه بهتر است)"}
              </li>
              <li className={persianChars === 0 ? "text-emerald-600" : "text-amber-600"}>
                {persianChars === 0
                  ? "همهٔ نویسه‌ها لاتین هستند."
                  : `${persianChars} نویسهٔ فارسی باقی مانده (کلمهٔ بدون معادل لاتین).`}
              </li>
              <li className="text-ink-500">خط تیره برای جدا کردن کلمه‌ها به‌کار رفته، نه زیرخط یا فاصله.</li>
            </ul>
          </div>
        )}
      </ToolPanel>
    </div>
  );
}

/* ─────────────── canonical ─────────────── */

export function CanonicalChecker() {
  const [pageUrl, setPageUrl] = useState("");
  const [canonical, setCanonical] = useState("");
  const [html, setHtml] = useState("");

  const detected = useMemo(() => {
    const match = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    return match?.[1] ?? "";
  }, [html]);

  const target = canonical.trim() || detected;
  const normalize = (url: string) =>
    url.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "").toLowerCase();

  const same = normalize(pageUrl) === normalize(target) && pageUrl.trim() !== "";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel title="آدرس صفحه" icon={<Link2 className="h-4 w-4 text-brand-600" aria-hidden="true" />}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">آدرس واقعی صفحه</label>
            <input value={pageUrl} onChange={(event) => setPageUrl(event.target.value)} dir="ltr" placeholder="https://abzaro.ir/salary" data-testid="canonical-page" className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-left text-sm outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">مقدار تگ canonical</label>
            <input value={canonical} onChange={(event) => setCanonical(event.target.value)} dir="ltr" placeholder="https://abzaro.ir/salary" data-testid="canonical-value" className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-left text-sm outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">یا سورس صفحه (اختیاری)</label>
            <textarea value={html} onChange={(event) => setHtml(event.target.value)} rows={4} dir="ltr" placeholder={'<link rel="canonical" href="…">'} data-testid="canonical-html" className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-left font-mono text-xs outline-none focus:border-brand-400" />
          </div>
        </div>
      </ToolPanel>
      <ToolPanel title="نتیجه">
        {pageUrl.trim() === "" && target === "" ? (
          <ResultHint>آدرس صفحه و مقدار canonical را وارد کنید.</ResultHint>
        ) : (
          <div className="space-y-2 text-xs" data-testid="canonical-result">
            <div className={`rounded-xl border px-3 py-2.5 ${same ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
              {target === ""
                ? "تگ canonical در صفحه پیدا نشد. بدون آن، اگر همان محتوا در چند آدرس باشد گوگل خودش انتخاب می‌کند."
                : same
                  ? "canonical با آدرس واقعی صفحه یکی است (تفاوت www، http/https و اسلش آخر نادیده گرفته شد). درست است."
                  : "canonical با آدرس واقعی یکی نیست؛ در این حالت همهٔ اعتبار صفحه به آدرس هدف منتقل می‌شود."}
            </div>
            {detected && (
              <p className="rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-5 text-ink-500">
                مقدار شناسایی‌شده از سورس: <span dir="ltr" className="font-mono">{detected}</span>
              </p>
            )}
            <p className="rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-5 text-ink-500">
              canonical باید آدرس کامل با https باشد و به صفحهٔ ۴۰۴ یا ریدایرکت‌شده اشاره نکند.
            </p>
          </div>
        )}
      </ToolPanel>
    </div>
  );
}
