"use client";

import { useState } from "react";
import { Download, ImageIcon } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/image";
import { toPersianDigits } from "@/lib/persian";
import { LoadingState } from "@/components/ui/Feedbacks";
import { UploadZone } from "./UploadZone";
import { cn } from "@/lib/utils";

const MAX_BYTES = 40 * 1024 * 1024;

interface Item {
  id: string;
  file: File;
  blob: Blob | null;
  url: string | null;
  error: string | null;
}

/**
 * HEIC/HEIF → JPG. iPhone photos are HEIC, which most sites and Windows
 * machines reject; the conversion runs in the browser via `heic2any`
 * (lazy-loaded, so the ~1 MB decoder is only fetched when needed).
 */
export function HeicToJpg() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [quality, setQuality] = useState(0.92);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: File[]) {
    setError(null);
    const accepted = files.filter((file) => {
      const isHeic = /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
      if (!isHeic) {
        setError("این ابزار فقط فایل‌های HEIC/HEIF (عکس آیفون) را می‌پذیرد.");
        return false;
      }
      if (file.size > MAX_BYTES) {
        setError("حجم هر فایل باید کمتر از ۴۰ مگابایت باشد.");
        return false;
      }
      return true;
    });

    if (accepted.length === 0) return;

    setBusy(true);
    const next: Item[] = [];
    for (const [index, file] of accepted.entries()) {
      const id = `heic-${Date.now()}-${index}`;
      try {
        const { default: heic2any } = await import("heic2any");
        const converted = await heic2any({ blob: file, toType: "image/jpeg", quality });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        if (!blob) throw new Error("empty");
        next.push({ id, file, blob, url: URL.createObjectURL(blob), error: null });
      } catch {
        next.push({
          id,
          file,
          blob: null,
          url: null,
          error: "تبدیل این فایل ممکن نشد. مطمئن شوید فایل HEIC سالم است.",
        });
      }
    }
    setItems((previous) => [...next, ...previous]);
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <UploadZone
        accept=".heic,.heif,image/heic,image/heif"
        multiple
        title="عکس‌های HEIC آیفون را انتخاب کنید"
        hint="چند فایل هم‌زمان مجاز است — فایل شما آپلود نمی‌شود"
        buttonLabel="انتخاب عکس HEIC"
        testId="heic-input"
        onFiles={(files) => void handleFiles(files)}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3 shadow-card">
        <label htmlFor="heic-quality" className="text-xs font-semibold text-ink-700">
          کیفیت خروجی
        </label>
        <input
          id="heic-quality"
          type="range"
          min={0.5}
          max={1}
          step={0.02}
          value={quality}
          onChange={(event) => setQuality(Number(event.target.value))}
          className="flex-1 accent-brand-600"
        />
        <span className="w-12 text-end text-xs font-bold text-brand-700">
          {toPersianDigits(Math.round(quality * 100))}٪
        </span>
        <p className="w-full text-[11px] leading-6 text-ink-500">
          کیفیت فقط روی تبدیل‌های بعدی اثر دارد. HEIC یک قالب فشرده است، بنابراین
          JPG خروجی معمولاً حجم بیشتری دارد ولی در همه‌جا باز می‌شود.
        </p>
      </div>

      {busy && <LoadingState label="در حال تبدیل HEIC به JPG…" hint="هر عکس چند ثانیه زمان می‌برد." />}

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="heic-results">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
              <div className="relative aspect-[4/3] bg-ink-50">
                {item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.file.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-ink-300">
                    <ImageIcon className="h-8 w-8" aria-hidden="true" />
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-bold text-ink-900">{item.file.name}</p>
                {item.blob ? (
                  <>
                    <p className="mt-0.5 text-[11px] text-ink-500">
                      {formatBytes(item.file.size)} ← {formatBytes(item.blob.size)}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        downloadBlob(item.blob as Blob, item.file.name.replace(/\.(heic|heif)$/i, "") + ".jpg")
                      }
                      className={cn(
                        "mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700",
                      )}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      دانلود JPG
                    </button>
                  </>
                ) : (
                  <p className="mt-1 text-[11px] font-medium text-red-600">{item.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
