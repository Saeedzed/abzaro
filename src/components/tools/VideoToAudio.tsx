"use client";

import { useState } from "react";
import { baseNameOf, extensionOf } from "@/lib/video";
import { cn } from "@/lib/utils";
import { VideoToolShell } from "./VideoToolShell";

const BITRATES = [
  { id: "192", label: "۱۹۲ کیلوبیت (کیفیت بالا)", value: "192k" },
  { id: "128", label: "۱۲۸ کیلوبیت (پیشنهادی)", value: "128k" },
  { id: "64", label: "۶۴ کیلوبیت (کم‌حجم)", value: "64k" },
] as const;

/** Extract the audio track as MP3 — podcast clips, voice notes, music. */
export function VideoToAudio() {
  const [bitrate, setBitrate] = useState<(typeof BITRATES)[number]>(BITRATES[1]);

  return (
    <VideoToolShell
      id="video-to-audio"
      title="ویدیو را انتخاب کنید تا صدایش جدا شود"
      hint="MP3 خروجی در همهٔ پخش‌کننده‌ها باز می‌شود"
      run={async (file) => {
        const inputName = `input.${extensionOf(file.name)}`;
        const outputName = `${baseNameOf(file.name)}.mp3`;
        return {
          args: ["-i", inputName, "-vn", "-acodec", "libmp3lame", "-b:a", bitrate.value, outputName],
          inputName,
          outputName,
          label: `MP3 · ${bitrate.value}`,
        };
      }}
    >
      {() => (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-ink-700">کیفیت صدا</p>
          <div className="grid gap-2">
            {BITRATES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setBitrate(item)}
                aria-pressed={bitrate.id === item.id}
                className={cn(
                  "rounded-xl border px-3 py-2 text-start text-xs transition",
                  bitrate.id === item.id
                    ? "border-brand-500 bg-brand-50 font-semibold text-brand-800"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-300",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-6 text-ink-500">
            اگر ویدیو صدای چندکاناله داشته باشد، به استریو تبدیل می‌شود.
            هیچ فایلی آپلود نمی‌شود.
          </p>
        </div>
      )}
    </VideoToolShell>
  );
}
