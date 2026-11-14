import type { Category } from "@/data/categories";

/**
 * A flat, two-tone illustration per category. Deliberately abstract (no text)
 * so it reads at any size and inherits the page palette; every shape derives
 * from the category's own idea so the five covers feel like one set.
 */
export function CategoryArt({
  slug,
  className = "h-full w-full",
}: {
  slug: Category["slug"];
  className?: string;
}) {
  const common = {
    viewBox: "0 0 120 64",
    className,
    role: "presentation" as const,
    "aria-hidden": true,
  };

  switch (slug) {
    /* متن و ویرایش — three text lines, one of them being "cleaned" */
    case "text":
      return (
        <svg {...common}>
          <rect x="8" y="14" width="72" height="7" rx="3.5" fill="currentColor" opacity="0.35" />
          <rect x="8" y="29" width="96" height="7" rx="3.5" fill="currentColor" opacity="0.18" />
          <rect x="8" y="44" width="54" height="7" rx="3.5" fill="currentColor" opacity="0.18" />
          <circle cx="101" cy="47.5" r="9" fill="currentColor" opacity="0.09" />
          <path d="M97 47.5l3 3 5-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.75" />
        </svg>
      );

    /* اعداد و محاسبات — bars + a percent mark */
    case "numbers":
      return (
        <svg {...common}>
          <rect x="10" y="38" width="14" height="18" rx="4" fill="currentColor" opacity="0.18" />
          <rect x="32" y="28" width="14" height="28" rx="4" fill="currentColor" opacity="0.3" />
          <rect x="54" y="18" width="14" height="38" rx="4" fill="currentColor" opacity="0.45" />
          <circle cx="96" cy="30" r="14" fill="currentColor" opacity="0.1" />
          <circle cx="91" cy="25" r="3" fill="currentColor" opacity="0.7" />
          <circle cx="101" cy="35" r="3" fill="currentColor" opacity="0.7" />
          <path d="M101 24l-10 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
        </svg>
      );

    /* تصاویر — two overlapping frames with a sun */
    case "images":
      return (
        <svg {...common}>
          <rect x="12" y="10" width="56" height="44" rx="7" fill="currentColor" opacity="0.16" />
          <rect x="44" y="18" width="56" height="42" rx="7" fill="currentColor" opacity="0.3" />
          <circle cx="88" cy="31" r="5.5" fill="currentColor" opacity="0.65" />
          <path d="M48 54l16-14 12 10 10-7 10 11z" fill="currentColor" opacity="0.5" />
        </svg>
      );

    /* فایل و PDF — a document with a folded corner and page lines */
    case "files":
      return (
        <svg {...common}>
          <path d="M34 6h38l18 18v36a6 6 0 01-6 6H40a6 6 0 01-6-6V12a6 6 0 016-6z" fill="currentColor" opacity="0.2" />
          <path d="M72 6l18 18H78a6 6 0 01-6-6V6z" fill="currentColor" opacity="0.45" />
          <rect x="46" y="32" width="34" height="4" rx="2" fill="currentColor" opacity="0.5" />
          <rect x="46" y="42" width="24" height="4" rx="2" fill="currentColor" opacity="0.4" />
          <rect x="46" y="52" width="30" height="4" rx="2" fill="currentColor" opacity="0.3" />
        </svg>
      );

    /* برنامه‌نویسی و وب — code brackets in a browser window */
    case "dev":
      return (
        <svg {...common}>
          <rect x="8" y="8" width="104" height="48" rx="8" fill="currentColor" opacity="0.14" />
          <circle cx="18" cy="17" r="2.6" fill="currentColor" opacity="0.5" />
          <circle cx="27" cy="17" r="2.6" fill="currentColor" opacity="0.35" />
          <path d="M52 26l-9 8 9 8M68 26l9 8-9 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
        </svg>
      );

    default:
      return null;
  }
}
