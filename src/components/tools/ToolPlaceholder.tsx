import Link from "next/link";
import { ArrowLeft, Hammer } from "lucide-react";
import type { Tool } from "@/data/tools";

/**
 * Clearly-marked placeholder for tools that are registered but not yet
 * implemented. Keeps the route, SEO metadata and internal linking real
 * while the tool itself is under development.
 */
export function ToolPlaceholder({ tool }: { tool: Tool }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-ink-50 px-6 py-12 text-center sm:px-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-card">
        <Hammer className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-xl font-extrabold text-ink-900">
        این ابزار در حال آماده‌سازی است
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-ink-600">
        {tool.description} تیم ابزارو در حال توسعهٔ «{tool.title}» است و به‌زودی
        آن را منتشر می‌کنیم. در همین حین می‌توانید از ابزارهای آماده استفاده
        کنید.
      </p>
      <Link
        href="/tools"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        مشاهده همه ابزارها
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
