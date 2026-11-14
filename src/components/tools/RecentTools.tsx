"use client";

import Link from "next/link";
import { ArrowLeft, History, X } from "lucide-react";
import { tools } from "@/data/tools";
import { IconTile } from "@/components/ui/IconTile";
import { useRecentTools } from "@/lib/use-recent-tools";

/**
 * «اخیراً استفاده کردید» — a compact shortcut strip on the homepage, filled
 * from localStorage. Renders nothing until it has hydrated with real data, so
 * visitors who have never opened a tool see no empty box.
 */
export function RecentTools() {
  const { slugs, ready, clear } = useRecentTools();
  const recent = slugs
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is (typeof tools)[number] => Boolean(tool))
    .slice(0, 4);

  if (!ready || recent.length === 0) return null;

  return (
    <section className="border-b border-ink-200/60 bg-white py-6" aria-labelledby="recent-heading">
      <div className="flex flex-wrap items-center gap-3">
        <h2
          id="recent-heading"
          className="flex items-center gap-1.5 text-xs font-bold text-ink-500"
        >
          <History className="h-3.5 w-3.5" aria-hidden="true" />
          اخیراً استفاده کردید
        </h2>

        <ul className="flex flex-1 flex-wrap gap-2">
          {recent.map((tool) => {
            const Icon = tool.icon;
            return (
              <li key={tool.id}>
                <Link
                  href={`/tools/${tool.slug}`}
                  className="flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pe-3 ps-1 text-xs font-medium text-ink-700 shadow-card transition hover:border-brand-300 hover:text-brand-700"
                >
                  <IconTile icon={Icon} size="sm" className="h-6 w-6 rounded-full" />
                  {tool.title}
                  <ArrowLeft className="h-3 w-3 opacity-60" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-ink-400 transition hover:bg-ink-100 hover:text-ink-600"
        >
          <X className="h-3 w-3" aria-hidden="true" />
          پاک کردن
        </button>
      </div>
    </section>
  );
}
