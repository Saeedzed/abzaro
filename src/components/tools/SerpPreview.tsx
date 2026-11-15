"use client";

import { useMemo, useState } from "react";
import { Globe, Monitor, Smartphone } from "lucide-react";
import { charLength, estimateSerpWidth, SEO_LIMITS } from "@/lib/seo";
import { ToolPanel } from "./shared";
import { formatFa } from "./shared";

/**
 * Google SERP preview with honest truncation.
 *
 * Google truncates by pixel width, not character count, so the preview shows
 * BOTH: a pixel-based visual cut and the character counters with the usual
 * 60/158 guidance. Claiming "155 characters always fits" would be wrong.
 */
export function SerpPreview() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("example.com/page");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  const titleWidth = useMemo(() => estimateSerpWidth(title, device === "desktop" ? 20 : 18), [title, device]);
  const maxTitleWidth = device === "desktop" ? 600 : 560;
  const descWidth = useMemo(() => estimateSerpWidth(description, 14), [description]);
  const maxDescWidth = device === "desktop" ? 920 : 900;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel title="محتوای صفحه" icon={<Globe className="h-4 w-4 text-brand-600" aria-hidden="true" />}>
        <div className="space-y-3">
          <Field label="عنوان (title)" value={title} onChange={setTitle} placeholder="محاسبهٔ حقوق و مالیات ۱۴۰۴ — رایگان" testId="serp-title" />
          <Field label="متا دیسکریپشن" value={description} onChange={setDescription} placeholder="حقوق خالص را با بیمه و مالیات حساب کنید…" rows={3} testId="serp-description" />
          <Field label="آدرس نمایشی" value={url} onChange={setUrl} placeholder="abzaro.ir/salary" ltr testId="serp-url" />
        </div>
        <div className="mt-4 flex gap-2" role="tablist" aria-label="اندازهٔ دستگاه">
          {(["desktop", "mobile"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={device === option}
              onClick={() => setDevice(option)}
              className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition ${
                device === option ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
              }`}
            >
              {option === "desktop" ? <Monitor className="h-3.5 w-3.5" aria-hidden="true" /> : <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />}
              {option === "desktop" ? "دسکتاپ" : "موبایل"}
            </button>
          ))}
        </div>
      </ToolPanel>

      <ToolPanel title="پیش‌نمایش در گوگل">
        <div className={device === "mobile" ? "mx-auto max-w-sm" : ""} data-testid="serp-preview">
          <div className="rounded-xl border border-ink-200 bg-white p-3 shadow-card">
            <p className="flex items-center gap-1.5 text-[11px] text-ink-600" dir="ltr">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ink-100 text-[8px]">A</span>
              {url || "example.com"}
            </p>
            <p
              dir="rtl"
              className="mt-1 overflow-hidden text-[15px] leading-6 text-[#1a0dab]"
              style={{ maxHeight: device === "desktop" ? 48 : 44 }}
            >
              {title || "عنوان صفحه در اینجا نمایش داده می‌شود"}
            </p>
            <p dir="rtl" className="mt-1 overflow-hidden text-[12px] leading-5 text-ink-600" style={{ maxHeight: 60 }}>
              {description || "توضیح متای صفحه در اینجا نمایش داده می‌شود. این متن همان چیزی است که کاربر قبل از کلیک می‌خواند."}
            </p>
          </div>

          <div className="mt-3 space-y-2 text-[11px]">
            <Meter label="عنوان" length={charLength(title)} max={SEO_LIMITS.titleMax} min={SEO_LIMITS.titleMin} width={titleWidth} maxWidth={maxTitleWidth} testId="serp-title-meter" />
            <Meter label="توضیح" length={charLength(description)} max={SEO_LIMITS.descriptionMax} min={SEO_LIMITS.descriptionMin} width={descWidth} maxWidth={maxDescWidth} testId="serp-desc-meter" />
          </div>

          <p className="mt-3 rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-5 text-ink-500">
            گوگل بر اساس <strong>عرض پیکسلی</strong> می‌بُرد، نه تعداد نویسه؛ پس ۶۰ نویسهٔ حروف باریک با ۶۰ نویسهٔ حروف
            پهن یک‌جا نمایش داده نمی‌شوند. عرض تخمینی عنوان: {formatFa(titleWidth)} پیکسل از حدود {formatFa(maxTitleWidth)}.
          </p>
        </div>
      </ToolPanel>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  rows,
  ltr,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  ltr?: boolean;
  testId: string;
}) {
  const shared = {
    value,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
    placeholder,
    "data-testid": testId,
    dir: ltr ? ("ltr" as const) : undefined,
    className:
      "w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100" +
      (ltr ? " text-left" : ""),
  };
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-ink-600">{label}</label>
      {rows ? <textarea rows={rows} {...shared} /> : <input {...shared} />}
    </div>
  );
}

function Meter({
  label,
  length,
  min,
  max,
  width,
  maxWidth,
  testId,
}: {
  label: string;
  length: number;
  min: number;
  max: number;
  width: number;
  maxWidth: number;
  testId: string;
}) {
  const over = length > max;
  const under = length > 0 && length < min;
  const percent = Math.min(100, (width / maxWidth) * 100);
  return (
    <div data-testid={testId}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-ink-600">{label}</span>
        <span className={over ? "font-bold text-rose-600" : under ? "font-bold text-amber-600" : "font-bold text-emerald-600"}>
          {formatFa(length)} نویسه
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-rose-500" : under ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {over && <p className="mt-1 text-[10px] text-rose-600">از محدودهٔ {formatFa(max)} نویسه رد شده؛ بخشی از آن در نتایج دیده نمی‌شود.</p>}
    </div>
  );
}
