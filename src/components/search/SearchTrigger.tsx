"use client";

import { Search } from "lucide-react";

/**
 * Compact "search" affordance in the header that opens the ⌘K palette instead
 * of duplicating a second dropdown. Mobile users get the same button.
 */
export function SearchTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("abzaro:open-search"))}
      aria-label="باز کردن جست‌وجوی سراسری ابزارها"
      data-testid="search-trigger"
      className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-start shadow-card transition hover:border-brand-300"
    >
      <Search className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
      <span className="flex-1 truncate text-sm text-ink-400">
        جست‌وجوی ابزار…
      </span>
      <kbd className="hidden shrink-0 rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-500 lg:block">
        Ctrl K
      </kbd>
    </button>
  );
}
