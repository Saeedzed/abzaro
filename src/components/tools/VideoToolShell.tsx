"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Play, TriangleAlert, Video, X } from "lucide-react";
import { downloadBlob, formatBytes } from "@/lib/image";
import { toPersianDigits } from "@/lib/persian";
import {
  convertVideo,
  formatDuration,
  inspectVideo,
  isVideoError,
  LARGE_VIDEO_BYTES,
  VIDEO_MEMORY_HINT_BYTES,
  type VideoInfo,
} from "@/lib/video";
import { UploadZone } from "./UploadZone";
import { cn } from "@/lib/utils";

export interface VideoResult {
  blob: Blob;
  name: string;
  info: string;
}

interface VideoToolShellProps {
  /** Unique prefix for test ids, e.g. `video-compress`. */
  id: string;
  title: string;
  hint: string;
  /** Options panel rendered above the action button. */
  children: (context: { file: File; info: VideoInfo; busy: boolean }) => React.ReactNode;
  /** Build the ffmpeg run + a label describing the output. */
  run: (file: File, hooks: {
    onProgress: (ratio: number) => void;
    onLog: (line: string) => void;
    info: VideoInfo | null;
  }) => Promise<{
    args: string[];
    inputName: string;
    outputName: string;
    label: string;
    /** Extra ffmpeg passes (GIF palette): `args` runs first, then these. */
    passes?: string[][];
  }>;
  /** Clip-copy progress events do not represent reliable percentage. */
  indeterminateProgress?: boolean;
  /** Disabled until the options are valid. */
  canRun?: boolean;
}

/**
 * One shell for all five video tools: pick a file, show its metadata, render
 * tool-specific options, run ffmpeg in the browser with a progress bar, then
 * offer the result. The first run also downloads the 31 MB ffmpeg core, so the
 * shell explains that instead of looking frozen.
 */
export function VideoToolShell({ id, title, hint, children, run, canRun = true, indeterminateProgress = false }: VideoToolShellProps) {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStartedAt, setProcessingStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const logRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!busy || processingStartedAt === null) return;
    const update = () => setElapsedSeconds((Date.now() - processingStartedAt) / 1000);
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [busy, processingStartedAt]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!result) {
      setResultUrl(null);
      return;
    }
    const url = URL.createObjectURL(result.blob);
    setResultUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  async function handleFiles(files: File[]) {
    const next = files[0];
    if (!next) return;
    setError(null);
    setResult(null);
    setProgress(0);
    setStage("");
    const inspected = await inspectVideo(next);
    if (isVideoError(inspected)) {
      setError(inspected.error);
      setFile(null);
      setInfo(null);
      return;
    }
    setFile(next);
    setInfo(inspected);
  }

  useEffect(() => () => abortRef.current?.abort(), []);

  function cancel() {
    abortRef.current?.abort();
    setStage("در حال لغو…");
  }

  async function start() {
    if (!file) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setProcessingStartedAt(null);
    setElapsedSeconds(0);
    setStage("در حال آماده‌سازی موتور ویدیو…");
    logRef.current = "";

    try {
      const recipe = await run(file, {
        info,
        onProgress: (ratio) => {
          setStage("در حال پردازش…");
          if (ratio > 0) setProcessingStartedAt((started) => started ?? Date.now());
          setProgress(ratio);
        },
        onLog: (line) => {
          logRef.current += line + "\n";
        },
      });

      if (controller.signal.aborted) throw new Error("پردازش لغو شد.");
      const converted = await convertVideo(file, {
        args: recipe.args,
        passes: recipe.passes,
        inputName: recipe.inputName,
        outputName: recipe.outputName,
        durationSeconds: info?.durationSeconds ?? null,
        signal: controller.signal,
        onPhase: (phase) => {
          if (!controller.signal.aborted) setStage(phase === "processing" ? "در حال پردازش…" : "در حال آماده‌سازی فایل خروجی…");
        },
        onProgress: (ratio) => {
          if (controller.signal.aborted) return;
          if (ratio > 0) setProcessingStartedAt((started) => started ?? Date.now());
          setProgress(ratio);
        },
        onLog: (line) => {
          logRef.current += line + "\n";
        },
      });

      if (controller.signal.aborted) throw new Error("پردازش لغو شد.");
      setResult({
        blob: converted.blob,
        name: `${recipe.outputName}`,
        info: recipe.label,
      });
      setProgress(1);
      setStage("");
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "پردازش انجام نشد.");
    } finally {
      setBusy(false);
      setStage("");
      abortRef.current = null;
    }
  }

  return (
    <div className="space-y-4">
      <UploadZone
        disabled={busy}
        accept="video/*,.mp4,.mov,.mkv,.webm,.avi,.m4v,.3gp"
        title={title}
        hint={hint}
        buttonLabel="انتخاب ویدیو"
        testId={`${id}-input`}
        onFiles={(files) => void handleFiles(files)}
      />

      {file && info && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* options */}
          <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <Video className="h-4 w-4 text-brand-600" aria-hidden="true" />
                {file.name}
              </h3>
              <span className="text-[11px] text-ink-500">
                {formatBytes(file.size)}
                {info.durationSeconds ? ` · ${formatDuration(info.durationSeconds)}` : ""}
                {info.width && info.height ? ` · ${toPersianDigits(info.width)}×${toPersianDigits(info.height)}` : ""}
              </span>
            </div>

            {file.size > VIDEO_MEMORY_HINT_BYTES && (
              <p className="mt-3 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-[11px] leading-6 text-ink-600">
                فایل بزرگی انتخاب کرده‌اید ({formatBytes(file.size)}). محدودیتی
                نداریم، اما پردازش در مرورگر انجام می‌شود؛ اگر دستگاه کم‌حافظه
                باشد ممکن است کند شود. با «لغو پردازش» می‌توانید متوقف کنید.
              </p>
            )}

            {file.size > LARGE_VIDEO_BYTES && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-6 text-amber-800">
                این فایل بیش از ۲ گیگابایت است. پردازش در مرورگر انجام می‌شود و
                ممکن است بسته به حافظهٔ دستگاه کند یا متوقف شود؛ برای فایل‌های
                بزرگ‌تر، از کامپیوتر استفاده کنید.
              </p>
            )}

            <div className="mt-4">{children({ file, info, busy })}</div>

            <button
              type="button"
              onClick={() => void start()}
              disabled={busy || !canRun}
              data-testid={`${id}-run`}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              {busy ? "در حال پردازش…" : "شروع پردازش"}
            </button>

            {busy && (
              <div className="mt-3 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3" data-testid={`${id}-progress`}>
                <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-ink-600">
                  <span>{stage || "در حال پردازش…"}</span>
                  {!indeterminateProgress && <span className="tabular-nums">{toPersianDigits(Math.round(progress * 100))}٪</span>}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-200">
                  <div
                    className={cn("h-full rounded-full bg-brand-500 transition-[width] duration-300", (indeterminateProgress || progress === 0) && "animate-pulse")}
                    style={{ width: indeterminateProgress ? "35%" : `${Math.max(4, progress * 100)}%` }}
                  />
                </div>
                {indeterminateProgress && <p className="mt-2 text-xs leading-6 text-ink-600">درصد دقیق این عملیات قابل محاسبه نیست. تا نمایش دکمهٔ دانلود منتظر بمانید؛ آماده‌سازی فایل‌های بزرگ ممکن است زمان ببرد.</p>}
                {id === "video-compressor" && (
                  <p className="mt-2 text-xs leading-6 text-ink-600" data-testid={`${id}-eta`} aria-live="polite">
                    {processingStartedAt === null || elapsedSeconds < 5 || progress < 0.02
                      ? "زمان باقی‌مانده پس از شروع پردازش تخمین زده می‌شود."
                      : progress >= 0.98
                        ? "در حال تکمیل فایل؛ زمان باقی‌مانده نامشخص است."
                        : `زمان تقریبی باقی‌مانده: ${formatDuration(Math.max(1, Math.round(elapsedSeconds * (1 - progress) / progress)))} (ممکن است تغییر کند)`}
                  </p>
                )}
                <p className="mt-2 text-[11px] leading-6 text-ink-500">
                  در استفادهٔ اول، موتور ویدیو حدود ۱۰ مگابایت دانلود می‌شود و سپس پردازش داخل مرورگر انجام می‌شود.
                </p>
                <button
                  type="button"
                  onClick={cancel}
                  data-testid={`${id}-cancel`}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-ink-100"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  لغو پردازش
                </button>
              </div>
            )}

            {error && (
              <p role="alert" data-testid={`${id}-error`} className="mt-3 flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            {error && error !== "پردازش لغو شد." && logRef.current && (
              <details className="mt-3 rounded-xl border border-ink-200 p-3 text-xs text-ink-600">
                <summary className="cursor-pointer font-semibold">جزئیات فنی خطا</summary>
                <p className="mt-2">این گزارش ممکن است نام فایل شما را داشته باشد؛ پیش از ارسال آن را بررسی کنید.</p>
                <pre dir="ltr" className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-left">{logRef.current.split("\n").slice(-30).join("\n")}</pre>
              </details>
            )}

            {result && (
              <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3" data-testid={`${id}-result`}>
                <p className="text-center text-sm font-bold text-brand-900">فایل آماده است</p>
                <p className="mt-0.5 text-center text-[11px] text-brand-700">
                  {result.info} · {formatBytes(result.blob.size)}
                </p>
                <button
                  type="button"
                  onClick={() => downloadBlob(result.blob, result.name)}
                  data-testid={`${id}-download`}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  دانلود خروجی
                </button>
              </div>
            )}
          </div>

          {/* preview */}
          <div className="rounded-2xl border border-ink-200 bg-white p-3 shadow-card">
            <p className="mb-2 text-[11px] font-bold text-ink-500">
              {resultUrl ? "پیش‌نمایش خروجی" : "پیش‌نمایش ورودی"}
            </p>
            {resultUrl && result?.blob.type.startsWith("video/") ? (
              <video src={resultUrl} controls className="w-full rounded-xl bg-black" data-testid={`${id}-out-preview`} />
            ) : resultUrl && result?.blob.type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resultUrl} alt="خروجی" className="w-full rounded-xl" />
            ) : resultUrl ? (
              <audio src={resultUrl} controls className="w-full" data-testid={`${id}-out-audio`} />
            ) : previewUrl ? (
              <video src={previewUrl} controls className="w-full rounded-xl bg-black" data-testid={`${id}-in-preview`} />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
