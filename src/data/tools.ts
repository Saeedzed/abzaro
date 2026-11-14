import {
  BadgePercent,
  CalendarDays,
  Eraser,
  Hash,
  Languages,
  Minimize2,
  Percent,
  Scaling,
  SpellCheck,
  Type,
  type LucideIcon,
} from "lucide-react";

/**
 * Tool registry — the single source of truth for every tool on Abzaro.
 *
 * Metadata lives here; the actual implementation of each tool lives in its
 * own component under src/components/tools/. Adding a new tool means:
 *   1. adding an entry below,
 *   2. creating its component,
 *   3. wiring it in src/app/tools/[slug]/page.tsx.
 */

export type ToolStatus = "live" | "soon";

export interface Tool {
  /** Stable unique id (never changes, even if the slug does). */
  id: string;
  /** URL slug — used in /tools/[slug]. */
  slug: string;
  /** Persian display title. */
  title: string;
  /** Short Persian description shown on cards and the tool page. */
  description: string;
  /** Category slug (see src/data/categories.ts). */
  category: string;
  /** Lucide icon component. */
  icon: LucideIcon;
  /** SEO <title> (brand suffix is added by the layout template). */
  seoTitle: string;
  /** SEO meta description. */
  seoDescription: string;
  /** Search keywords (Persian + English) used by SearchBox and meta keywords. */
  keywords: string[];
  /** "live" = fully implemented · "soon" = placeholder page. */
  status: ToolStatus;
  /** Shown in the homepage "popular tools" section. */
  popular: boolean;
  /** ISO date the tool was added — drives the "recently added" section. */
  addedAt: string;
}

export const tools: Tool[] = [
  {
    id: "word-counter",
    slug: "word-counter",
    title: "شمارش کلمات",
    description:
      "تعداد کلمات، کاراکترها، جمله‌ها و زمان تقریبی مطالعهٔ متن خود را به‌صورت لحظه‌ای بشمارید.",
    category: "text",
    icon: Type,
    seoTitle: "شمارش کلمات آنلاین رایگان",
    seoDescription:
      "تعداد کلمات، کاراکترها، جمله‌ها، پاراگراف‌ها و زمان مطالعهٔ متن را به‌صورت رایگان و لحظه‌ای بشمارید؛ بدون نیاز به ثبت‌نام.",
    keywords: ["شمارش کلمات", "تعداد کلمات", "word counter", "شمارش واژه", "تعداد واژه"],
    status: "live",
    popular: true,
    addedAt: "2025-11-01",
  },
  {
    id: "character-counter",
    slug: "character-counter",
    title: "شمارش کاراکترها",
    description:
      "تعداد کاراکترهای متن را با و بدون فاصله، به همراه تعداد خطوط و حجم متن محاسبه کنید.",
    category: "text",
    icon: Hash,
    seoTitle: "شمارش کاراکتر آنلاین رایگان",
    seoDescription:
      "تعداد کاراکترهای متن را با و بدون فاصله، تعداد کلمات، خطوط و حجم متن را به‌صورت رایگان و لحظه‌ای محاسبه کنید.",
    keywords: ["شمارش کاراکتر", "تعداد کاراکتر", "character counter", "شمارش حروف"],
    status: "live",
    popular: true,
    addedAt: "2025-11-01",
  },
  {
    id: "persian-number-converter",
    slug: "persian-number-converter",
    title: "تبدیل اعداد به فارسی",
    description:
      "اعداد انگلیسی را به ارقام فارسی تبدیل کنید و برعکس؛ با جداکنندهٔ هزارگان فارسی.",
    category: "numbers",
    icon: Languages,
    seoTitle: "تبدیل اعداد به فارسی و برعکس",
    seoDescription:
      "اعداد انگلیسی را به ارقام فارسی با جداکنندهٔ هزارگان تبدیل کنید و ارقام فارسی را به انگلیسی برگردانید؛ رایگان و بدون ثبت‌نام.",
    keywords: ["تبدیل عدد به فارسی", "اعداد فارسی", "persian numbers", "تبدیل ارقام", "اعداد انگلیسی به فارسی"],
    status: "live",
    popular: true,
    addedAt: "2025-11-05",
  },
  {
    id: "persian-text-cleaner",
    slug: "persian-text-cleaner",
    title: "پاک‌سازی متن فارسی",
    description:
      "فاصله‌های اضافی، نیم‌فاصله‌های نادرست و کاراکترهای نامرئی متن فارسی را یکجا تمیز کنید.",
    category: "text",
    icon: Eraser,
    seoTitle: "پاک‌سازی متن فارسی آنلاین",
    seoDescription:
      "متن فارسی را از فاصله‌های اضافی، نیم‌فاصله‌های نادرست و کاراکترهای نامرئی پاک کنید؛ رایگان و در مرورگر شما.",
    keywords: ["پاک‌سازی متن", "تمیز کردن متن فارسی", "حذف فاصله اضافی", "نیم‌فاصله"],
    status: "live",
    popular: false,
    addedAt: "2025-11-10",
  },
  {
    id: "number-to-words",
    slug: "number-to-words",
    title: "تبدیل عدد به حروف",
    description:
      "هر عددی را به حروف فارسی تبدیل کنید؛ از اعداد ساده تا اعداد بسیار بزرگ.",
    category: "numbers",
    icon: SpellCheck,
    seoTitle: "تبدیل عدد به حروف فارسی",
    seoDescription:
      "هر عددی را به حروف فارسی تبدیل کنید؛ مناسب برای فاکتور، چک و متن‌های رسمی. رایگان و بدون ثبت‌نام.",
    keywords: ["تبدیل عدد به حروف", "عدد به حروف", "number to words", "حروف فارسی"],
    status: "live",
    popular: false,
    addedAt: "2025-11-10",
  },
  {
    id: "percentage-calculator",
    slug: "percentage-calculator",
    title: "محاسبه درصد",
    description:
      "درصد یک عدد از عدد دیگر، افزایش و کاهش درصدی و محاسبات روزمره را سریع و دقیق انجام دهید.",
    category: "numbers",
    icon: Percent,
    seoTitle: "محاسبه درصد آنلاین رایگان",
    seoDescription:
      "درصد یک عدد از عدد دیگر، افزایش و کاهش درصدی را به‌صورت رایگان و دقیق محاسبه کنید؛ بدون نیاز به ثبت‌نام.",
    keywords: ["محاسبه درصد", "درصد گیری", "percentage calculator", "درصد عدد"],
    status: "live",
    popular: true,
    addedAt: "2025-11-12",
  },
  {
    id: "discount-calculator",
    slug: "discount-calculator",
    title: "محاسبه تخفیف",
    description:
      "قیمت بعد از تخفیف و مبلغ تخفیف را بر اساس درصد یا مبلغ ثابت محاسبه کنید.",
    category: "numbers",
    icon: BadgePercent,
    seoTitle: "محاسبه تخفیف آنلاین رایگان",
    seoDescription:
      "قیمت نهایی بعد از تخفیف و مبلغ تخفیف را بر اساس درصد یا مبلغ ثابت محاسبه کنید؛ سریع و رایگان.",
    keywords: ["محاسبه تخفیف", "قیمت بعد از تخفیف", "discount calculator", "درصد تخفیف"],
    status: "live",
    popular: false,
    addedAt: "2025-11-12",
  },
  {
    id: "age-calculator",
    slug: "age-calculator",
    title: "محاسبه سن",
    description:
      "سن دقیق خود را با تاریخ تولد شمسی، به سال، ماه و روز محاسبه کنید.",
    category: "numbers",
    icon: CalendarDays,
    seoTitle: "محاسبه سن با تاریخ تولد شمسی",
    seoDescription:
      "سن دقیق خود را با وارد کردن تاریخ تولد شمسی، به سال، ماه و روز محاسبه کنید؛ رایگان و بدون ثبت‌نام.",
    keywords: ["محاسبه سن", "سن دقیق", "age calculator", "تاریخ تولد شمسی"],
    status: "live",
    popular: false,
    addedAt: "2025-11-12",
  },
  {
    id: "image-resizer",
    slug: "image-resizer",
    title: "تغییر اندازه تصویر",
    description:
      "ابعاد تصویر را بدون افت کیفیت تغییر دهید؛ همه‌چیز در مرورگر شما انجام می‌شود.",
    category: "images",
    icon: Scaling,
    seoTitle: "تغییر اندازه تصویر آنلاین رایگان",
    seoDescription:
      "ابعاد تصاویر را به‌صورت رایگان و بدون افت کیفیت تغییر دهید؛ فایل شما هرگز از دستگاهتان خارج نمی‌شود.",
    keywords: ["تغییر اندازه تصویر", "resize image", "کوچک کردن عکس", "ابعاد تصویر"],
    status: "live",
    popular: false,
    addedAt: "2025-11-14",
  },
  {
    id: "image-compressor",
    slug: "image-compressor",
    title: "فشرده‌سازی تصویر",
    description:
      "حجم تصاویر را بدون افت محسوس کیفیت کاهش دهید؛ فایل شما هرگز از دستگاهتان خارج نمی‌شود.",
    category: "images",
    icon: Minimize2,
    seoTitle: "فشرده‌سازی تصویر آنلاین رایگان",
    seoDescription:
      "حجم تصاویر را بدون افت محسوس کیفیت کاهش دهید؛ پردازش کاملاً در مرورگر شما انجام می‌شود و فایلتان آپلود نمی‌شود.",
    keywords: ["فشرده‌سازی تصویر", "کم کردن حجم عکس", "compress image", "کاهش حجم تصویر"],
    status: "live",
    popular: true,
    addedAt: "2025-11-14",
  },
];

/** Tools flagged as popular, in registry order. */
export const popularTools: Tool[] = tools.filter((tool) => tool.popular);

/** All tools sorted by newest first (for the "recently added" section). */
export const recentTools: Tool[] = [...tools].sort((a, b) =>
  b.addedAt.localeCompare(a.addedAt),
);

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(categorySlug: string): Tool[] {
  return tools.filter((tool) => tool.category === categorySlug);
}
