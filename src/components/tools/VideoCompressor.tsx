"use client";

import { useState } from "react";
import { baseNameOf, extensionOf } from "@/lib/video";
import { formatBytes } from "@/lib/image";
import { toPersianDigits } from "@/lib/persian";
import { videoBitrateBudget } from "@/lib/video-target";
import { VideoToolShell } from "./VideoToolShell";

/** Single-pass bitrate targeting: fast and local, but not an exact size guarantee. */
export function VideoCompressor() {
  const [percentage, setPercentage] = useState(50);

  return (
    <VideoToolShell
      id="video-compressor"
      title="ویدیو را انتخاب کنید"
      hint="MP4، MOV، MKV یا WebM — پردازش در مرورگر"
      run={async (file, { info }) => {
        const inputName = `input.${extensionOf(file.name)}`;
        const outputName = `${baseNameOf(file.name)}-compressed.mp4`;
        const duration = info?.durationSeconds;
        const budget = duration ? videoBitrateBudget(file.size, duration, percentage) : null;
        const args = ["-i", inputName];
        // Cap large inputs at 720p without enlarging smaller clips.
        if (info?.height) {
          const height = Math.max(2, Math.floor(Math.min(info.height, 720) / 2) * 2);
          args.push("-vf", `scale=-2:${height}`);
        }
        args.push("-c:v", "libx264", "-preset", "superfast");
        if (budget) args.push("-b:v", `${budget.videoKbps}k`);
        else args.push("-crf", "30");
        args.push("-c:a", "aac", "-b:a", `${budget?.audioKbps ?? 96}k`, "-movflags", "+faststart", outputName);
        return {
          args, inputName, outputName,
          label: budget ? `حجم هدف تقریبی ${formatBytes(budget.targetBytes)}` : "حجم هدف نامشخص؛ فشرده‌سازی خودکار",
        };
      }}
    >
      {({ file, info, busy }) => {
        const target = file.size * percentage / 100;
        const budget = info.durationSeconds ? videoBitrateBudget(file.size, info.durationSeconds, percentage) : null;
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-ink-200 bg-ink-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="video-target-size" className="text-sm font-bold text-ink-900">حجم خروجی دلخواه</label>
                <strong className="text-base text-brand-700" data-testid="video-target-size">{formatBytes(target)}</strong>
              </div>
              <p className="mt-1 text-xs leading-6 text-ink-600">
                حدود {toPersianDigits(percentage)}٪ از حجم اصلی ({formatBytes(file.size)})
              </p>
              <input id="video-target-size" data-testid="video-target-slider" type="range" min="5" max="95" step="1"
                dir="ltr" value={percentage} disabled={busy} onChange={(event) => setPercentage(Number(event.target.value))}
                aria-valuetext={`${toPersianDigits(percentage)} درصد، ${formatBytes(target)}`}
                className="mt-3 min-h-11 w-full cursor-pointer accent-brand-600" />
              <div className="flex justify-between text-[11px] text-ink-500" dir="ltr"><span>حجم کمتر</span><span>کیفیت بیشتر</span></div>
            </div>
            <p className="text-xs leading-6 text-ink-600">
              حجم انتخابی تقریبی است، نه تضمینی. کاهش بیشتر حجم می‌تواند کیفیت را کم کند و بعضی فایل‌ها ممکن است از اندازهٔ انتخابی بزرگ‌تر شوند. برای سرعت، ارتفاع ویدیو حداکثر ۷۲۰ پیکسل می‌شود.
            </p>
            {!durationKnown(info.durationSeconds) && (
              <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                مرورگر مدت این ویدیو را تشخیص نداد؛ در این حالت فشرده‌سازی خودکار انجام می‌شود و اندازهٔ انتخابی قابل تخمین نیست. برای انتخاب حجم، فایل MP4 سازگار امتحان کنید.
              </p>
            )}
            {budget?.belowMinimum && (
              <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                اندازهٔ انتخابی برای مدت ویدیو بسیار کم است؛ خروجی احتمالاً بزرگ‌تر از مقدار انتخابی خواهد بود.
              </p>
            )}
          </div>
        );
      }}
    </VideoToolShell>
  );
}

function durationKnown(duration: number | null): boolean {
  return duration !== null && Number.isFinite(duration) && duration > 0;
}
