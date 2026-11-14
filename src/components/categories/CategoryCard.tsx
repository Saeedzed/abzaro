import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Category } from "@/data/categories";
import { countToolsInCategory } from "@/data/tools";
import { IconTile } from "@/components/ui/IconTile";
import { CategoryArt } from "@/components/categories/CategoryArt";
import { toPersianDigits } from "@/lib/persian";

interface CategoryCardProps {
  category: Category;
}

/** Card linking to a category page: illustration cover, icon, count. */
export function CategoryCard({ category }: CategoryCardProps) {
  const Icon = category.icon;
  const count = countToolsInCategory(category.slug);

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card transition duration-200 ease-out hover:-translate-y-1 hover:border-brand-300 hover:shadow-card-hover"
    >
      {/* Illustration cover */}
      <div className="border-b border-ink-100 bg-gradient-to-br from-brand-50 via-brand-50/60 to-white px-3 text-brand-600">
        <CategoryArt slug={category.slug} className="h-24 w-full" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <IconTile icon={Icon} size="sm" solid />
          <h3 className="text-base font-bold text-ink-900">{category.title}</h3>
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-ink-600">
          {category.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-500">
            {toPersianDigits(count)} ابزار
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-brand-600">
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
