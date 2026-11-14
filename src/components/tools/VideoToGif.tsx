"use client";

import { useState } from "react";
import { baseNameOf, extensionOf } from "@/lib/video";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";
import { VideoToolShell } from "./VideoToolShell";

const WIDTHS = [
  { id: "480", label: "۴۸۰ پیکسل", width: 480 },
  { id: "360", label: "۳۶۰ پیکسل", width: 360 },
  { id: "240", label: "۲۴۰ پیکسل", width: 240 },
] as const;

const FPS = [
  { id: "10", label: "۱۰ فریم", fps: 10 },
  { id: "15", label: "۱۵ فریم (نرم‌تر)", fps: 15 },
] as const;

/**
 * Video → GIF. Two-pass ffmpeg: generate a palette then apply it, otherwise
 * GIF output looks washed out and banded.
 */
export function VideoToGif() {
  const [width, setWidth] = useState<(typeof WIDTHS)[number]>(WIDTHS[0]);
  const [fps, setFps] = useState<(typeof FPS)[number]>(FPS[0]);
  const [from, setFrom] = useState("0");
  const [to, setTo] = useState("");

  const startValid = Number(from) >= 0;
  const endValid = to.trim() === "" || Number(to) > Number(from);

  return (
    <VideoToolShell
      id="video-to-gif"
      title="ویدیو را برای تبدیل به GIF انتخاب کنید"
      hint="بهتر است ویدیوی کوتاه (کمتر از ۳۰ ثانیه) باشد"
      canRun={startValid && endValid}
      run={async (file) => {
        const inputName = `input.${extensionOf(file.name)}`;
        const outputName = `${baseNameOf(file.name)}.gif`;

        const start = Math.max(0, Number(from) || 0);
        const end = to.trim() === "" ? null : Number(to);
        const clipArgs =
          end !== null && end > start
            ? ["-ss", String(start), "-t", String(end - start)]
            : start > 0
              ? ["-ss", String(start)]
              : [];

        // Palette pass then apply — same output name so the shell reads one file.
        const filter = `fps=${fps.fps},scale=${width.width}:-1:flags=lanczos`;
        return {
          args: [
            "-i", inputName,
            ...clipArgs,
            "-vf", `${filter},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
            outputName,
          ],
          inputName,
          outputName,
          label: `GIF · ${width.label} · ${fps.label}`,
        };
      }}
    >
      {() => (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-ink-700">عرض GIF</p>
              <div className="flex flex-wrap gap-2">
                {WIDTHS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setWidth(item)}
                    aria-pressed={width.id === item.id}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
                      width.id === item.id
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
              <p className="mb-2 text-xs font-semibold text-ink-700">نرخ فریم</p>
              <div className="flex flex-wrap gap-2">
                {FPS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFps(item)}
                    aria-pressed={fps.id === item.id}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
                      fps.id === item.id
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-ink-200 bg-white text-ink-600 hover:border-brand-300",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-ink-700">
              شروع (ثانیه)
              <input
                type="number"
                min={0}
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                data-testid="video-gif-from"
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="block text-xs font-semibold text-ink-700">
              پایان (ثانیه)
              <input
                type="number"
                min={0}
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder="تا آخر"
                data-testid="video-gif-to"
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
          </div>

          {!endValid && (
            <p className="text-[11px] font-medium text-red-600">
              زمان پایان باید بزرگ‌تر از زمان شروع باشد.
            </p>
          )}

          <p className="rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-6 text-ink-500">
            برای GIF فقط بخش کوچکی از ویدیو را انتخاب کنید؛ GIF حجم زیادی می‌گیرد
            ({toPersianDigits(width.width)} پیکسل با {toPersianDigits(fps.fps)} فریم بر ثانیه).
          </p>
        </div>
      )}
    </VideoToolShell>
  );
}
