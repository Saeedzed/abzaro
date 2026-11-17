"use client";

import { useEffect, useRef, useState } from "react";
import { convertVideo, baseNameOf, extensionOf } from "@/lib/video";
import { downloadBlob, formatBytes } from "@/lib/image";
import { UploadZone } from "./UploadZone";

const formats = {
  mp3: { label: "MP3", args: ["-c:a", "libmp3lame", "-b:a", "192k"] },
  m4a: { label: "M4A (AAC)", args: ["-c:a", "aac", "-b:a", "192k"] },
  wav: { label: "WAV (بدون فشرده‌سازی)", args: ["-c:a", "pcm_s16le"] },
} as const;
type Format = keyof typeof formats;

export default function AudioConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<Format>("mp3");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  function choose(files: File[]) {
    const next = files[0];
    if (!next) return;
    setResult(null); setError("");
    if (!/\.(mp3|wav|m4a|aac|ogg|opus|flac|webm|aiff|aif)$/i.test(next.name) || !next.size) {
      setFile(null); setError("فایل صوتی غیرخالی با فرمت MP3، WAV، M4A، AAC، OGG، Opus، FLAC، WebM یا AIFF انتخاب کنید."); return;
    }
    setFile(next);
  }
  async function start() {
    if (!file || busy) return;
    const abort = new AbortController(); controller.current = abort;
    setBusy(true); setError(""); setResult(null);
    const inputName = `input.${extensionOf(file.name)}`;
    const outputName = `${baseNameOf(file.name)}-converted.${format}`;
    try {
      const output = await convertVideo(file, {
        inputName, outputName, signal: abort.signal,
        args: ["-i", inputName, "-map", "0:a:0", "-vn", ...formats[format].args, outputName],
      });
      setResult({ blob: output.blob, name: outputName });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "تبدیل انجام نشد."); }
    finally { controller.current = null; setBusy(false); }
  }
  return <div className="space-y-4">
    <UploadZone title="فایل صوتی را انتخاب کنید" hint="MP3، WAV، M4A، AAC، OGG، Opus، FLAC، WebM یا AIFF" buttonLabel="انتخاب فایل صوتی" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.opus,.flac,.webm,.aiff,.aif" onFiles={choose} disabled={busy} testId="audio-converter-input" />
    {file && <section className="space-y-4 rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
      <p className="break-all text-sm font-semibold text-ink-900">{file.name} · {formatBytes(file.size)}</p>
      <label className="block text-sm font-semibold text-ink-700">فرمت خروجی
        <select value={format} disabled={busy} onChange={event => { setFormat(event.target.value as Format); setResult(null); }} data-testid="audio-converter-format" className="mt-2 min-h-11 w-full rounded-lg border border-ink-200 bg-white px-3">
          {(Object.keys(formats) as Format[]).map(key => <option key={key} value={key}>{formats[key].label}</option>)}
        </select>
      </label>
      <p className="text-xs leading-6 text-ink-500">پردازش فایل داخل مرورگر انجام می‌شود. MP3 و AAC فشرده‌سازی با افت کیفیت دارند؛ WAV ممکن است حجم زیادی داشته باشد. موتور تبدیل در اولین استفاده دانلود می‌شود.</p>
      <button type="button" onClick={() => void start()} disabled={busy} data-testid="audio-converter-run" className="min-h-11 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "در حال تبدیل…" : "شروع تبدیل"}</button>
      {busy && <button type="button" onClick={() => controller.current?.abort()} data-testid="audio-converter-cancel" className="min-h-11 rounded-lg border border-ink-300 px-4 text-sm">لغو پردازش</button>}
      {result && <button type="button" onClick={() => downloadBlob(result.blob, result.name)} data-testid="audio-converter-download" className="min-h-11 w-full rounded-xl border border-brand-400 px-4 py-2 text-sm font-bold text-brand-700">دانلود {formats[format].label} · {formatBytes(result.blob.size)}</button>}
    </section>}
    {error && <p role="alert" data-testid="audio-converter-error" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  </div>;
}
