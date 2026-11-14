"use client";

import { useEffect, useState } from "react";
import { Check, Copy, FileImage, Loader2, RotateCcw } from "lucide-react";
import { formatBytes } from "@/lib/image";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";
import { UploadZone } from "./UploadZone";

const MAX_BYTES = 5 * 1024 * 1024;

const VARIANTS = [
  { id: "raw" as const, label: "Base64 خالص" },
  { id: "data" as const, label: "data: URI" },
  { id: "css" as const, label: "CSS background" },
  { id: "html" as const, label: "تگ <img>" },
];

/**
 * Image → Base64.
 *
 * Reads the file with FileReader and gives the user the encoded string in the
 * shape they need (raw, data URI, CSS or an <img> tag).
 */
export function ImageToBase64() {
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [mime, setMime] = useState("image/png");
  const [base64, setBase64] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]["id"]>("data");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError(null);
    setCopied(false);

    if (!file.type.startsWith("image/")) {
      setError("فقط فایل تصویری پذیرفته می‌شود.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("برای تبدیل به Base64، حجم تصویر باید کمتر از ۵ مگابایت باشد.");
      return;
    }

    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      const chunk = 8192;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      setBase64(btoa(binary));
      setMime(file.type);
      setFileName(file.name);
      setFileSize(file.size);
      setPreview(URL.createObjectURL(file));
    } catch {
      setError("خواندن این تصویر ممکن نشد.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setBase64("");
    setFileName("");
    setFileSize(0);
    setError(null);
    setCopied(false);
  }

  const dataUri = `data:${mime};base64,${base64}`;
  const output =
    variant === "raw"
      ? base64
      : variant === "data"
        ? dataUri
        : variant === "css"
          ? `background-image: url("${dataUri}");`
          : `<img src="${dataUri}" alt="${fileName.replace(/"/g, "")}" />`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!base64) {
    return (
      <UploadZone
        title="تصویر را اینجا رها کنید"
        hint="PNG، JPG، SVG، WebP یا GIF — حداکثر ۵ مگابایت"
        buttonLabel="انتخاب تصویر"
        accept="image/*"
        onFiles={(files) => void handleFiles(files)}
        icon={<FileImage className="h-7 w-7" aria-hidden="true" />}
        error={error}
        testId="base64-input"
      >
        {busy && (
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-ink-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            در حال کدگذاری…
          </p>
        )}
      </UploadZone>
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt={fileName} className="h-11 w-11 rounded-lg border border-ink-200 object-cover" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink-900" data-testid="base64-name">
                {fileName}
              </p>
              <p className="mt-0.5 text-xs text-ink-500">
                {formatBytes(fileSize)} · {mime} · Base64:{" "}
                {formatBytes(Math.round((base64.length * 3) / 4))}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            تصویر دیگر
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {VARIANTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setVariant(item.id)}
                aria-pressed={variant === item.id}
                data-testid={`base64-variant-${item.id}`}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition",
                  variant === item.id
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-ink-200 text-ink-600 hover:bg-ink-100",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void copy()}
            data-testid="base64-copy"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? "کپی شد" : "کپی"}
          </button>
        </div>

        <textarea
          readOnly
          dir="ltr"
            value={output}
          rows={10}
          data-testid="base64-output"
          aria-label="خروجی Base64"
          className="code-pane mt-3 w-full resize-y rounded-xl border border-ink-200 bg-ink-50 p-3 font-mono text-[11px] leading-5 text-ink-800"
        />
        <p className="mt-2 text-[11px] leading-5 text-ink-400">
          طول متن: {toPersianDigits(output.length)} کاراکتر — می‌توانید همه را انتخاب و
          کپی کنید.
        </p>
      </div>
    </div>
  );
}
