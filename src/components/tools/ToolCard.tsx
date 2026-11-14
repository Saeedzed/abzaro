import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Tool } from "@/data/tools";
import { getCategory } from "@/data/categories";

interface ToolCardProps {
  tool: Tool;
}

/** Card linking to a single tool page. */
export function ToolCard({ tool }: ToolCardProps) {
  const Icon = tool.icon;
  const category = getCategory(tool.category);
  const isSoon = tool.status === "soon";

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-ink-200 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {isSoon && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
            به‌زودی
          </span>
        )}
      </div>

      <h3 className="mt-4 text-base font-bold text-ink-900">{tool.title}</h3>
      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-ink-600">
        {tool.description}
      </p>

      <div className="mt-4 flex items-center justify-between">
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
    </Link>
  );
}
