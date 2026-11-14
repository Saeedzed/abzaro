"use client";

import { useId, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

/**
 * Shared building blocks for the calculator-style tools.
 * Keeping these in one place means every tool looks and behaves identically.
 */

/** A labelled numeric input with optional suffix (تومان, %…). */
export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  error,
  min,
  max,
  step,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  error?: string | null;
  min?: number;
  max?: number;
  step?: number;
  autoFocus?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          dir="ltr"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "w-full rounded-xl border bg-white px-4 py-3 text-left text-lg font-semibold text-ink-900 outline-none transition placeholder:text-ink-300 placeholder:font-normal focus:ring-4",
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-ink-200 focus:border-brand-400 focus:ring-brand-100",
            suffix && "pe-16",
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-sm font-medium text-ink-400">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** A read-only result row with a copy button. */
export function ResultRow({
  label,
  value,
  hint,
  copyable = true,
  emphasize = false,
}: {
  label: string;
  value: string;
  hint?: string;
  copyable?: boolean;
  emphasize?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context) — fail silently.
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5",
        emphasize
          ? "border-brand-200 bg-brand-50"
          : "border-ink-200 bg-ink-50",
      )}
    >
      <div className="min-w-0">
        <div className="text-xs font-medium text-ink-500">{label}</div>
        <div
          className={cn(
            "mt-0.5 truncate font-extrabold",
            emphasize ? "text-brand-900 text-xl" : "text-ink-900 text-lg",
          )}
        >
          {value}
        </div>
        {hint && <div className="mt-0.5 text-[11px] text-ink-400">{hint}</div>}
      </div>
      {copyable && value && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`کپی ${label}`}
          title="کپی"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-card transition hover:bg-brand-100"
        >
          {copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}

/** A panel that groups related calculator inputs. */
export function ToolPanel({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
      <h3 className="flex items-center gap-2 text-base font-bold text-ink-900">
        {icon}
        {title}
      </h3>
      {description && <p className="mt-1 text-xs text-ink-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** Empty state shown before the user enters anything. */
export function ResultHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-6 text-center text-sm text-ink-400">
      {children}
    </div>
  );
}

/**
 * Format a number with Persian digits and the Persian thousands separator
 * (٬ U+066C) — `Intl` with en-US would emit a Latin comma, which looks wrong
 * next to Persian digits.
 */
export function formatFa(value: number, maximumFractionDigits = 2): string {
  const grouped = new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
  return toPersianDigits(grouped).replace(/,/g, "٬").replace(/\./g, "٫");
}

/** Format an amount as Persian currency (تومان). */
export function formatToman(value: number): string {
  return `${formatFa(value, 0)} تومان`;
}
