"use client";

import { useRef, useState, type ReactNode } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable drag-and-drop upload zone.
 *
 * Every file tool uses this so the drop behaviour, keyboard access and error
 * styling stay identical across the site.
 */
export function UploadZone({
  title,
  hint,
  buttonLabel,
  accept,
  multiple,
  onFiles,
  icon,
  error,
  testId,
  children,
  disabled = false,
  sampleSkipConfirmation = false,
  useFileBrowser = false,
}: {
  title: string;
  hint: string;
  buttonLabel: string;
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  icon?: ReactNode;
  error?: string | null;
  testId?: string;
  children?: ReactNode;
  disabled?: boolean;
  /** Use when the receiver performs its own replacement confirmation. */
  sampleSkipConfirmation?: boolean;
  /** Use an unfiltered file chooser; caller must validate the selected file. */
  useFileBrowser?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [sampleBusy, setSampleBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only offer samples whose real file type is accepted by this specific tool.
  // HEIC and password-protected PDF need different fixtures and are excluded.
  const sampleType = testId === "word-to-pdf-input" ? "docx"
    : testId === "audio-converter-input" ? "audio"
    : testId?.startsWith("video-") ? "video"
    : ["format-input", "base64-input", "profile-input"].includes(testId ?? "") ? "image"
    : ["pdf-compress-input", "pdf-merge-input", "pdf-reorder-input", "pdf-split-input", "pdf-watermark-input"].includes(testId ?? "") ? "pdf"
    : null;

  async function loadSample() {
    if (!sampleType || disabled || sampleBusy) return;
    if (!sampleSkipConfirmation && !window.confirm("فایل نمونه انتخاب شود؟ اگر فایلی انتخاب کرده‌اید ممکن است جایگزین شود.")) return;
    setSampleError(null); setSampleBusy(true);
    try {
      const specs = sampleType === "docx"
        ? [["/samples/sample.docx", "sample.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]]
        : sampleType === "audio"
        ? [["/samples/sample.wav", "sample.wav", "audio/wav"]]
        : sampleType === "video"
        ? [["/samples/sample.mp4", "sample.mp4", "video/mp4"]]
        : sampleType === "image"
          ? [["/samples/sample.png", "sample.png", "image/png"]]
          : multiple
            ? [["/samples/sample.pdf", "sample.pdf", "application/pdf"], ["/samples/sample-2.pdf", "sample-2.pdf", "application/pdf"]]
            : [["/samples/sample.pdf", "sample.pdf", "application/pdf"]];
      const files = await Promise.all(specs.map(async ([url, name, type]) => {
        const response = await fetch(url!);
        if (!response.ok) throw new Error("sample unavailable");
        return new File([await response.blob()], name!, { type: type! });
      }));
      onFiles(files);
    } catch {
      setSampleError("فایل نمونه دریافت نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.");
    } finally { setSampleBusy(false); }
  }

  function handle(list: FileList | null) {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) handle(event.dataTransfer.files);
        }}
        data-dragging={dragging ? "true" : "false"}
        className={cn(
          "rounded-2xl border-2 border-dashed p-8 text-center transition",
          dragging
            ? "border-brand-400 bg-brand-50"
            : "border-ink-200 bg-white hover:border-brand-300",
        )}
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          {icon ?? <Upload className="h-7 w-7" aria-hidden="true" />}
        </span>
        <p className="mt-4 text-base font-bold text-ink-900">{title}</p>
        <p className="mt-1 text-sm text-ink-500">{hint}</p>
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) {
              if (useFileBrowser) inputRef.current.removeAttribute("accept");
              else inputRef.current.accept = accept;
              inputRef.current.click();
            }
          }}
          disabled={disabled}
          data-testid={testId ? `${testId}-button` : undefined}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {buttonLabel}
        </button>
        {sampleType && (
          <button type="button" disabled={disabled || sampleBusy} onClick={() => void loadSample()}
            data-testid={testId ? `${testId}-sample` : undefined}
            className="mx-2 mt-4 inline-flex min-h-11 items-center rounded-lg border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50">
            {sampleBusy ? "در حال آماده‌سازی…" : "استفاده از فایل نمونه"}
          </button>
        )}
        {sampleError && <p role="alert" className="mt-2 text-xs text-red-600">{sampleError}</p>}
        <input
          ref={inputRef}
          type="file"
          disabled={disabled}
          accept={useFileBrowser ? undefined : accept}
          multiple={multiple}
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = ""; // allow retrying the same file
            if (useFileBrowser) event.currentTarget.removeAttribute("accept");
            else event.currentTarget.accept = accept;
            if (files.length) onFiles(files);
          }}
          className="sr-only"
          aria-label={title}
          data-testid={testId}
        />
        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        {children}
      </div>
      <p className="mt-4 text-xs leading-6 text-ink-400">
        فایل شما هرگز آپلود نمی‌شود؛ همهٔ پردازش‌ها داخل مرورگر خودتان انجام
        می‌شود.
      </p>
    </div>
  );
}
