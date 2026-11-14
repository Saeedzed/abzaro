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
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handle(list: FileList | null) {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handle(event.dataTransfer.files);
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
          onClick={() => inputRef.current?.click()}
          data-testid={testId ? `${testId}-button` : undefined}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {buttonLabel}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(event) => handle(event.target.files)}
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
