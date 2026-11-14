import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconTile } from "@/components/ui/IconTile";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Empty state                                                               */
/* -------------------------------------------------------------------------- */

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional call to action rendered under the text. */
  action?: React.ReactNode;
  className?: string;
  /** Use the dashed "drop something here" framing. */
  dashed?: boolean;
}

/** Shared «nothing here yet» block: results panels, filters, categories. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  dashed = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl px-6 py-10 text-center",
        dashed
          ? "border-2 border-dashed border-ink-200 bg-white"
          : "border border-ink-200 bg-ink-50/70",
        className,
      )}
    >
      <IconTile icon={icon} size="lg" />
      <p className="mt-4 text-sm font-bold text-ink-900">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs leading-6 text-ink-500">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Busy / loading state                                                      */
/* -------------------------------------------------------------------------- */

interface LoadingStateProps {
  /** Short Persian label, e.g. «در حال ادغام…». */
  label?: string;
  /** 0–100; omit for an indeterminate bar. */
  progress?: number;
  hint?: string;
  className?: string;
}

/**
 * Progress feedback for the heavy client-side tools (PDF merge/compress,
 * image batches) where a click can take a few seconds.
 */
export function LoadingState({
  label = "در حال پردازش…",
  progress,
  hint,
  className,
}: LoadingStateProps) {
  const clamped =
    typeof progress === "number"
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-2xl border border-ink-200 bg-white px-5 py-4 shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <Loader2
          className="h-4 w-4 animate-spin text-brand-600"
          aria-hidden="true"
        />
        <p className="text-sm font-bold text-ink-900">{label}</p>
        {clamped !== undefined && (
          <span className="ms-auto text-xs font-medium tabular-nums text-ink-500">
            {clamped.toLocaleString("fa-IR")}٪
          </span>
        )}
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
      >
        <div
          className={cn(
            "h-full rounded-full bg-brand-500 transition-[width] duration-300 ease-out",
            clamped === undefined && "w-1/3 animate-pulse",
          )}
          style={clamped !== undefined ? { width: `${clamped}%` } : undefined}
        />
      </div>

      {hint && <p className="mt-2.5 text-xs leading-6 text-ink-500">{hint}</p>}
    </div>
  );
}
