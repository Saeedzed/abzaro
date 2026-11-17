"use client";

import { useState } from "react";
import { Scissors } from "lucide-react";
import { baseNameOf, extensionOf, formatDuration } from "@/lib/video";
import { VideoToolShell } from "./VideoToolShell";

/**
 * Cut a clip out of a video. `-ss` before `-i` seeks fast, and re-encoding with
 * libx264 keeps the cut frame-accurate (stream copy would snap to keyframes).
 */
export function VideoTrimmer() {
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("");
  // Stream copy is ~50× faster than re-encoding in single-threaded wasm; it
  // snaps to the nearest keyframe, so «برش دقیق» is offered as an opt-in.
  const [precise, setPrecise] = useState(false);

  return (
    <VideoToolShell
      id="video-trimmer"
      title="ویدیو را برای بریدن انتخاب کنید"
      hint="زمان شروع و پایان را به ثانیه وارد کنید"
      canRun={Number(start) >= 0 && (end.trim() === "" || Number(end) > Number(start))}
      run={async (file, hooks) => {
        const inputName = `input.${extensionOf(file.name)}`;
        const outputName = `${baseNameOf(file.name)}-trimmed.mp4`;

        const from = Math.max(0, Number(start) || 0);
        const to = end.trim() === "" ? null : Number(end);
        const duration = to !== null ? Math.max(0.1, to - from) : null;

        if (duration) hooks.onLog(`trim ${from}s → ${to}s (${duration}s)`);

        return {
          args: precise
            ? [
                ...(from > 0 ? ["-ss", String(from)] : []),
                "-i", inputName,
                ...(duration ? ["-t", String(duration)] : []),
                "-map", "0:v:0", "-map", "0:a:0?",
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "24",
                "-c:a", "aac", "-b:a", "128k",
                "-movflags", "+faststart",
                outputName,
              ]
            : [
                ...(from > 0 ? ["-ss", String(from)] : []),
                "-i", inputName,
                ...(duration ? ["-t", String(duration)] : []),
                "-map", "0:v:0", "-map", "0:a:0?",
                "-c", "copy",
                "-avoid_negative_ts", "make_zero",
                outputName,
              ],
          inputName,
          outputName,
          label: duration
            ? `${formatDuration(from)} تا ${formatDuration(from + duration)}`
            : `${formatDuration(from)} تا پایان`,
        };
      }}
    >
      {({ info }) => (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-ink-700">
              شروع (ثانیه)
              <input
                type="number"
                min={0}
                value={start}
                onChange={(event) => setStart(event.target.value)}
                data-testid="video-trimmer-start"
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="block text-xs font-semibold text-ink-700">
              پایان (ثانیه)
              <input
                type="number"
                min={0}
                value={end}
                onChange={(event) => setEnd(event.target.value)}
                placeholder={info.durationSeconds ? String(Math.round(info.durationSeconds)) : "تا آخر"}
                data-testid="video-trimmer-end"
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
          </div>

          {info.durationSeconds && (
            <p className="flex items-center gap-1.5 text-[11px] text-ink-500">
              <Scissors className="h-3 w-3" aria-hidden="true" />
              طول ویدیو: {formatDuration(info.durationSeconds)}
              {end.trim() !== "" && Number(end) > Number(start) && (
                <> · خروجی: {formatDuration(Number(end) - Number(start))}</>
              )}
            </p>
          )}

          <label className="flex items-start gap-2 rounded-xl border border-ink-200 px-3 py-2 text-[11px] leading-6 text-ink-600">
            <input
              type="checkbox"
              checked={precise}
              onChange={(event) => setPrecise(event.target.checked)}
              data-testid="video-trimmer-precise"
              className="mt-1 accent-brand-600"
            />
            <span>
              <strong className="text-ink-800">برش دقیق (کندتر)</strong> — ویدیو دوباره
              کدگذاری می‌شود و برش ممکن است چند ده ثانیه طول بکشد. بدون این گزینه، برش
              سریع است ولی ممکن است تا نزدیک‌ترین کلید فریم جابه‌جا شود.
            </span>
          </label>

          <p className="rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-6 text-ink-500">
            برش سریع تصویر را دوباره کدگذاری نمی‌کند؛ برش دقیق ممکن است کیفیت را تغییر دهد. اگر زمان پایان را خالی بگذارید،
            ویدیو تا آخر بریده می‌شود.
          </p>
        </div>
      )}
    </VideoToolShell>
  );
}
