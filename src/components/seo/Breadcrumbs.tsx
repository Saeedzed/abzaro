import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";
import { Fragment } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/** Accessible breadcrumb navigation (visual + semantic). */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="مسیر صفحه">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 && (
                <ChevronLeft
                  className="h-4 w-4 text-ink-300"
                  aria-hidden="true"
                />
              )}
              <li>
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="flex min-h-8 items-center gap-1.5 text-ink-500 transition hover:text-brand-600"
                  >
                    {index === 0 && (
                      <Home className="h-4 w-4" aria-hidden="true" />
                    )}
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className="font-medium text-ink-900"
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
