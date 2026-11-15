import { categories } from "@/data/categories";
import { toPersianDigits } from "@/lib/persian";
import { countToolsInCategory } from "@/data/tools";
import { cn } from "@/lib/utils";

interface CategoryRailProps {
  /** Show the tool count under each label (default true). */
  className?: string;
  /** Extra class for each chip. */
  chipClassName?: string;
  /** On the homepage, link to category pages instead of in-page anchors. */
  linkToPages?: boolean;
}

/**
 * Horizontally scrollable category chips — the phone-first replacement for a
 * stacked column of giant cards. Costs a few pixels of height, gives instant
 * one-tap access to every category, and scrolls sideways like a native app.
 */
export function CategoryRail({ className, chipClassName, linkToPages = false }: CategoryRailProps) {
  return (
    <nav aria-label="دسته‌بندی‌ها" className={cn("-mx-4 px-4", className)}>
      <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <li key={category.slug} className="snap-start">
              <a
                href={linkToPages ? `/categories/${category.slug}/` : `#cat-${category.slug}`}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-ink-200 bg-white px-3.5 py-2 text-xs font-semibold text-ink-700 shadow-card transition active:scale-95",
                  chipClassName,
                )}
              >
                <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                {category.title}
                <span className="text-[10px] font-medium text-ink-400">
                  {toPersianDigits(countToolsInCategory(category.slug))}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
