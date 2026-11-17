"use client";

import { useState } from "react";
import { baseNameOf, extensionOf } from "@/lib/video";
import { VideoToolShell } from "./VideoToolShell";

const FORMATS = {
  mp4: { title: "MP4 (H.264 + AAC)", video: ["-c:v", "libx264", "-preset", "superfast", "-crf", "25", "-pix_fmt", "yuv420p"], audio: ["-c:a", "aac", "-b:a", "128k"], extra: ["-movflags", "+faststart"] },
  mov: { title: "MOV (H.264 + AAC)", video: ["-c:v", "libx264", "-preset", "superfast", "-crf", "25", "-pix_fmt", "yuv420p"], audio: ["-c:a", "aac", "-b:a", "128k"], extra: ["-movflags", "+faststart"] },
  mkv: { title: "MKV (H.264 + AAC)", video: ["-c:v", "libx264", "-preset", "superfast", "-crf", "25", "-pix_fmt", "yuv420p"], audio: ["-c:a", "aac", "-b:a", "128k"], extra: [] },
  webm: { title: "WebM (VP8 + Opus)", video: ["-c:v", "libvpx", "-deadline", "realtime", "-cpu-used", "8", "-threads", "1", "-b:v", "1M", "-pix_fmt", "yuv420p"], audio: ["-c:a", "libopus", "-b:a", "128k"], extra: [] },
} as const;
type VideoFormat = keyof typeof FORMATS;

export default function VideoConverter() {
  const [format, setFormat] = useState<VideoFormat>("mp4");
  return <VideoToolShell id="video-converter" title="ویدیو را برای تبدیل فرمت انتخاب کنید"
    hint="ورودی MP4، MOV، MKV، WebM، AVI یا 3GP"
    run={async file => {
      const inputName = `input.${extensionOf(file.name)}`;
      const outputName = `${baseNameOf(file.name)}-converted.${format}`;
      const selected = FORMATS[format];
      return {
        inputName, outputName, label: selected.title,
        args: ["-i", inputName, "-map", "0:v:0", "-map", "0:a:0?", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", ...selected.video, ...selected.audio, ...selected.extra, outputName],
      };
    }}>
    {({ busy }) => <div className="space-y-3">
      <label className="block text-sm font-bold text-ink-900" htmlFor="video-output-format">فرمت خروجی</label>
      <select id="video-output-format" data-testid="video-converter-format" value={format} disabled={busy}
        onChange={event => setFormat(event.target.value as VideoFormat)} className="min-h-11 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900">
        {(Object.keys(FORMATS) as VideoFormat[]).map(key => <option key={key} value={key}>{FORMATS[key].title}</option>)}
      </select>
      <p className="text-xs leading-6 text-ink-600">ویدیو دوباره کدگذاری می‌شود؛ کیفیت و حجم ممکن است تغییر کنند و فایل‌های طولانی روی گوشی زمان و حافظهٔ زیادی نیاز داشته باشند. اولین تصویر و صدای موجود در خروجی قرار می‌گیرند. پخش پیش‌نمایش بعضی فرمت‌ها به مرورگر بستگی دارد.</p>
    </div>}
  </VideoToolShell>;
}
