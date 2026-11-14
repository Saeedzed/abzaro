"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { tools } from "@/data/tools";
import { categories } from "@/data/categories";
import { searchTools } from "@/lib/search";
import { ToolCard } from "@/components/tools/ToolCard";
import { EmptyState } from "@/components/ui/Feedbacks";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

type Filter = "all" | string;

/**
 * Live filtering for /tools: category chips + instant search. The whole tool
 * registry is in the client bundle, so filtering is local and instant — the
 * page keeps working as a static export.
 */
export function ToolsExplorer() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const inCategory =
      filter === "all"
        ? tools
        : tools.filter((tool) => tool.category === filter);

    const q = query.trim();
    if (!q) return inCategory;

    const matched = new Set(searchTools(q, inCategory, inCategory.length).map((t) => t.id));
    return inCategory.filter((tool) => matched.has(tool.id));
  }, [filter, query]);

  const isSearching = query.trim().length > 0;
  const activeCategory = categories.find((category) => category.slug === filter);

  return (
    <div className="mt-8">
      {/* Controls */}
      <div className="rounded-2xl border border-ink-200 bg-white p-3 shadow-card sm:p-4">
        <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50/60 px-3 py-2 transition focus-within:border-brand-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-100">
          <Search className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جست‌وجو در ۲۵ ابزار… (مثلاً PDF، درصد، عکس)"
            aria-label="جست‌وجو در ابزارها"
            data-testid="tools-filter-input"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="پاک کردن جست‌وجو"
              className="shrink-0 rounded-md px-1.5 text-xs text-ink-400 transition hover:bg-ink-100 hover:text-ink-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-bold text-ink-400">
            <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
            فیلتر:
          </span>
          <button
            type="button"
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              filter === "all"
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700",
            )}
          >
            همه ({toPersianDigits(tools.length)})
          </button>
          {categories.map((category) => {
            const count = tools.filter((tool) => tool.category === category.slug).length;
            const active = filter === category.slug;
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => setFilter(category.slug)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  active
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700",
                )}
              >
                {category.title} ({toPersianDigits(count)})
              </button>
            );
          })}
        </div>
      </div>

      {/* Result summary */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-ink-500" data-testid="tools-filter-count">
          {toPersianDigits(visible.length)} ابزار
          {activeCategory ? ` در «${activeCategory.title}»` : ""}
          {isSearching ? ` برای «${query.trim()}»` : ""}
        </p>
        {(filter !== "all" || isSearching) && (
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setQuery("");
            }}
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            حذف فیلترها
          </button>
        )}
      </div>

      {/* Grid */}
      {visible.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-4"
          dashed
          icon={Search}
          title="ابزاری با این مشخصات پیدا نشد"
          description="عبارت کوتاه‌تری امتحان کنید یا فیلتر دسته‌بندی را بردارید."
          action={
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
              className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
            >
              نمایش همهٔ ابزارها
            </button>
          }
        />
      )}
    </div>
  );
}
