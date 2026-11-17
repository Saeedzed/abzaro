import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Category } from "@/data/categories";
import { countToolsInCategory } from "@/data/tools";
import { IconTile } from "@/components/ui/IconTile";
import { CategoryArt } from "@/components/categories/CategoryArt";
import { toPersianDigits } from "@/lib/persian";

interface CategoryCardProps {
  category: Category;
  /**
   * `compact` renders the phone version: no big illustration, icon + title +
   * count only, so a whole category list fits in one or two screens.
   */
  variant?: "full" | "compact";
}

/** Card linking to a category page: illustration cover, icon, count. */
export function CategoryCard({ category, variant = "full" }: CategoryCardProps) {
  const Icon = category.icon;
  const count = countToolsInCategory(category.slug);

  if (variant === "compact") {
    return (
      <Link
        href={`/categories/${category.slug}`}
        className="group flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 shadow-card transition active:scale-[0.99] hover:border-brand-300"
      >
        <IconTile icon={Icon} solid />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink-900">
            {category.title}
          </span>
          <span className="mt-0.5 block text-[11px] text-ink-500">
            {toPersianDigits(count)} ابزار
          </span>
        </span>
        <ArrowLeft
          className="h-4 w-4 shrink-0 text-brand-500 transition-transform group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    );
  }

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex min-h-11 min-w-0 h-full flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-ink-200 bg-white shadow-card transition duration-200 ease-out hover:-translate-y-1 hover:border-brand-300 hover:shadow-card-hover"
    >
      {/* Illustration cover */}
      <div className="border-b border-ink-100 bg-gradient-to-br from-brand-50 via-brand-50/60 to-white px-1 text-brand-600 sm:px-3">
        <CategoryArt slug={category.slug} className="motion-art h-10 w-full sm:h-24" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-1 py-2 text-center sm:p-5 sm:text-start">
        <div className="flex min-w-0 items-center justify-center sm:justify-start sm:gap-3">
          <span className="hidden sm:block"><IconTile icon={Icon} size="sm" solid /></span>
          <h3 className="min-w-0 break-words text-[10px] font-bold leading-4 text-ink-900 sm:text-base sm:leading-7">{category.title}</h3>
        </div>
        <p className="mt-2 hidden flex-1 text-sm leading-6 text-ink-600 sm:line-clamp-2">
          {category.description}
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-1 sm:mt-4 sm:justify-between">
          <span className="text-[10px] font-medium text-ink-500 sm:text-xs">
            {toPersianDigits(count)} ابزار
          </span>
          <span className="hidden items-center gap-1 text-xs font-semibold text-brand-600 sm:flex">
            مشاهده ابزارها
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
