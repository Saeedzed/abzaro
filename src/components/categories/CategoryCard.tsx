import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Category } from "@/data/categories";
import { tools } from "@/data/tools";
import { toPersianDigits } from "@/lib/persian";

interface CategoryCardProps {
  category: Category;
}

/** Card linking to a category page, with the number of tools it contains. */
export function CategoryCard({ category }: CategoryCardProps) {
  const Icon = category.icon;
  const count = tools.filter((tool) => tool.category === category.slug).length;

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-ink-200 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-bold text-ink-900">
        {category.title}
      </h3>
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
    </Link>
  );
}
