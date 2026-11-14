"use client";

import { useState } from "react";
import { MonitorSmartphone } from "lucide-react";
import { RESOLUTIONS, baseNameOf, extensionOf } from "@/lib/video";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";
import { VideoToolShell } from "./VideoToolShell";

const RATIOS = [
  { id: "keep", label: "حفظ نسبت اصلی" },
  { id: "9:16", label: "۹:۱۶ (استوری)" },
  { id: "1:1", label: "۱:۱ (مربع)" },
  { id: "16:9", label: "۱۶:۹ (افقی)" },
] as const;

/** Change video resolution, optionally cropping to a social-media aspect ratio. */
export function VideoResizer() {
  const [resolution, setResolution] = useState<(typeof RESOLUTIONS)[number]>(RESOLUTIONS[2]);
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>(RATIOS[0]);

  return (
    <VideoToolShell
      id="video-resizer"
      title="ویدیو را برای تغییر اندازه انتخاب کنید"
      hint="خروجی MP4 با کدک H.264"
      run={async (file) => {
        const inputName = `input.${extensionOf(file.name)}`;
        const outputName = `${baseNameOf(file.name)}-${resolution.id === "source" ? "resized" : resolution.id + "p"}.mp4`;
        const height = resolution.height;

        let filter: string | null = null;
        if (ratio.id !== "keep") {
          // Crop to the target ratio, then scale to the requested height.
          const [w, h] = ratio.id.split(":").map(Number) as [number, number];
          const crop = `crop='min(iw,ih*${w}/${h})':'min(ih,iw*${h}/${w})'`;
          filter = height ? `${crop},scale=-2:${height}` : crop;
        } else if (height) {
          filter = `scale=-2:${height}`;
        }

        return {
          args: [
            "-i", inputName,
            ...(filter ? ["-vf", filter] : []),
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "24",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            outputName,
          ],
          inputName,
          outputName,
          label: `${resolution.label}${ratio.id !== "keep" ? ` · ${ratio.label}` : ""}`,
        };
      }}
    >
      {({ info }) => (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-ink-700">رزولوشن خروجی</p>
            <div className="flex flex-wrap gap-2">
              {RESOLUTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setResolution(item)}
                  aria-pressed={resolution.id === item.id}
                  data-testid={`video-res-${item.id}`}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
                    resolution.id === item.id
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-ink-200 bg-white text-ink-600 hover:border-brand-300",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-ink-700">نسبت تصویر</p>
            <div className="flex flex-wrap gap-2">
              {RATIOS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRatio(item)}
                  aria-pressed={ratio.id === item.id}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
                    ratio.id === item.id
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-ink-200 bg-white text-ink-600 hover:border-brand-300",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {info.width && info.height && (
            <p className="flex items-center gap-1.5 text-[11px] text-ink-500">
              <MonitorSmartphone className="h-3 w-3" aria-hidden="true" />
              اندازهٔ فعلی: {toPersianDigits(info.width)}×{toPersianDigits(info.height)}
            </p>
          )}

          <p className="rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-6 text-ink-500">
            با انتخاب نسبت تصویر، بخش‌های اضافی از مرکز تصویر بریده می‌شوند
            (مناسب تبدیل ویدیوی افقی به استوری عمودی).
          </p>
        </div>
      )}
    </VideoToolShell>
  );
}
