"use client";

import { useState } from "react";
import { COMPRESSION_PRESETS, RESOLUTIONS, baseNameOf, extensionOf, type CompressionPreset } from "@/lib/video";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";
import { VideoToolShell } from "./VideoToolShell";

/**
 * Video → smaller MP4 (H.264 + AAC), the format WhatsApp and Telegram accept.
 * Presets map to a resolution cap plus a CRF value, so the user picks a
 * trade-off instead of a number they would have to look up.
 */
export function VideoCompressor() {
  const [preset, setPreset] = useState<CompressionPreset>(COMPRESSION_PRESETS[1]!);
  const [resolution, setResolution] = useState<string>("source");
  const [speed, setSpeed] = useState<"veryfast" | "superfast">("veryfast");

  return (
    <VideoToolShell
      id="video-compressor"
      title="ویدیو را انتخاب کنید"
      hint="MP4، MOV، MKV یا WebM — تا ۲ گیگابایت"
      run={async (file) => {
        const inputName = `input.${extensionOf(file.name)}`;
        const outputName = `${baseNameOf(file.name)}-compressed.mp4`;

        const selected = RESOLUTIONS.find((item) => item.id === resolution);
        const height = selected?.height ?? preset.height;

        const args = ["-i", inputName];
        if (height) {
          // -2 keeps the aspect ratio and rounds to an even number (H.264 needs even)
          args.push("-vf", `scale=-2:${height}`);
        }
        args.push(
          "-c:v", "libx264",
          "-crf", String(preset.crf),
          "-preset", speed,
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          outputName,
        );

        return {
          args,
          inputName,
          outputName,
          label: `${preset.label}${height ? ` · ${toPersianDigits(height)}p` : ""}`,
        };
      }}
    >
      {({ busy }) => (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-ink-700">سطح فشرده‌سازی</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {COMPRESSION_PRESETS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreset(item)}
                  aria-pressed={preset.id === item.id}
                  data-testid={`video-preset-${item.id}`}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-start transition",
                    preset.id === item.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-ink-200 bg-white hover:border-brand-300",
                  )}
                >
                  <span className="block text-xs font-bold text-ink-900">{item.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-5 text-ink-500">{item.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-ink-700">سرعت پردازش</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {([
                { id: "veryfast", label: "حجم کمتر", hint: "پیشنهادی؛ پردازش بیشتر، فایل معمولاً کوچک‌تر" },
                { id: "superfast", label: "سریع‌تر", hint: "زمان پردازش کمتر؛ حجم خروجی ممکن است بیشتر شود" },
              ] as const).map((option) => (
                <button key={option.id} type="button" disabled={busy} aria-pressed={speed === option.id}
                  data-testid={`video-speed-${option.id}`} onClick={() => setSpeed(option.id)}
                  className={cn("min-h-11 rounded-xl border px-3 py-2.5 text-start transition disabled:opacity-60",
                    speed === option.id ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-white hover:border-brand-300")}>
                  <span className="block text-xs font-bold text-ink-900">{option.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-5 text-ink-500">{option.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-700">
            حداکثر رزولوشن
            <select
              value={resolution}
              onChange={(event) => setResolution(event.target.value)}
              data-testid="video-resolution"
              className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs font-normal outline-none focus:border-brand-400"
            >
              {RESOLUTIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <p className="rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-6 text-ink-500">
            خروجی MP4 با کدک H.264 است تا در واتساپ، تلگرام و اینستاگرام بدون مشکل پخش شود.
            رزولوشن انتخابی، سقف ارتفاع است؛ نسبت تصویر حفظ می‌شود.
          </p>
        </div>
      )}
    </VideoToolShell>
  );
}
