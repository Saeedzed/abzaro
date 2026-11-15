import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Tool } from "@/data/tools";
import { IconTile } from "@/components/ui/IconTile";
import { getCategory } from "@/data/categories";

interface ToolCardProps {
  tool: Tool;
}

/**
 * Card linking to a single tool page.
 *
 * On phones it renders as a compact horizontal row (icon + title + one line),
 * so ~8 tools fit on one screen instead of ~2.5. From `sm` up it becomes the
 * full vertical card.
 */
export function ToolCard({ tool }: ToolCardProps) {
  const Icon = tool.icon;
  const category = getCategory(tool.category);
  const isSoon = tool.status === "soon";

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex h-full items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3.5 shadow-card transition duration-200 ease-out hover:-translate-y-1 hover:border-brand-300 hover:shadow-card-hover active:scale-[0.99] sm:flex-col sm:items-stretch sm:gap-0 sm:p-5"
    >
      <div className="flex shrink-0 items-center gap-3 sm:justify-between">
        <IconTile icon={Icon} hoverSolid />
        {isSoon && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200 sm:order-last">
            به‌زودی
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 sm:mt-4 sm:flex sm:h-full sm:flex-col">
        <h3 className="truncate text-sm font-bold text-ink-900 sm:whitespace-normal sm:text-base">
          {tool.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs leading-6 text-ink-500 sm:mt-2 sm:line-clamp-2 sm:flex-1 sm:text-sm sm:text-ink-600">
          {tool.description}
        </p>

        <div className="mt-0 hidden items-center justify-between sm:mt-4 sm:flex">
          {category && (
            <span className="text-xs font-medium text-ink-500">
              {category.title}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs font-semibold text-brand-600">
            استفاده از ابزار
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>

      <ArrowLeft
        className="h-4 w-4 shrink-0 text-brand-500 transition-transform group-hover:-translate-x-0.5 sm:hidden"
        aria-hidden="true"
      />
    </Link>
  );
}
