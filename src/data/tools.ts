import {
  ArrowDownUp,
  ArrowLeftRight,
  BadgePercent,
  Banknote,
  Binary,
  Braces,
  CalendarClock,
  CalendarDays,
  CalendarSync,
  CalendarRange,
  ChartColumn,
  Eraser,
  FileImage,
  FileText,
  Fingerprint,
  Hash,
  HeartPulse,
  Images,
  Languages,
  KeyRound,
  Landmark,
  Layers,
  Link2,
  ListFilter,
  Minimize2,
  Percent,
  QrCode,
  RotateCw,
  Ruler,
  Scissors,
  Scaling,
  SpellCheck,
  Trash2,
  Type,
  UserRound,
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
  /** Short Persian step-by-step «آموزش استفاده» list shown under the tool. */
  steps: string[];
  /** Primary category slug (see src/data/categories.ts). */
  category: string;
  /**
   * Extra categories this tool also belongs to. A tool appears in its primary
   * category plus every slug listed here (e.g. PDF converters live under both
   * «تصاویر» and «ویرایش فایل و PDF».
   */
  alsoIn?: string[];
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
    steps: [
      "متن فارسی یا انگلیسی خود را در کادر اصلی بچسبانید.",
      "آمار زندهٔ کلمات، کاراکترها، خطوط و جمله‌ها را در کارت‌های بالا ببینید.",
      "اگر می‌خواهید فقط متن خالص را نگه دارید، فاصله‌های اضافی را با دکمهٔ «پاک‌سازی» حذف کنید.",
    ],
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
    steps: [
      "متن را در کادر وارد کنید یا بچسبانید.",
      "تعداد کاراکتر با و بدون فاصله، و تعداد کاراکترهای شبکه‌های اجتماعی را ببینید.",
      "برای متن‌هایی با سقف کاراکتر (توییت، بیو، توضیحات سئو) از شمارندهٔ محدودیت‌دار استفاده کنید.",
    ],
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
    steps: [
      "عددها را با ارقام فارسی یا لاتین در کادر بریزید؛ ترکیب هر دو هم پذیرفته می‌شود.",
      "جهت تبدیل (فارسی ← لاتین یا لاتین ← فارسی) را انتخاب کنید.",
      "خروجی را کپی کنید و در فایل یا فرم خود بچسبانید.",
    ],
    category: "text",
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
    steps: [
      "متن به‌هم‌ریخته یا کپی‌شده از PDF و وب را در کادر بچسبانید.",
      "گزینه‌های پاک‌سازی (نیم‌فاصله، فاصله‌های تکراری، اعراب، کاراکترهای کنترلی) را انتخاب کنید.",
      "متن تمیز را کپی کنید یا فایل خروجی را دانلود کنید.",
    ],
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
    steps: [
      "عدد موردنظر را وارد کنید (پشتیبانی از اعداد بزرگ و اعشاری).",
      "دکمهٔ تبدیل را بزنید.",
      "معادل نوشتاری فارسی عدد را کپی کنید؛ مناسب چک، فاکتور و سند رسمی.",
    ],
    category: "text",
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
    steps: [
      "نوع محاسبه را انتخاب کنید: درصد از عدد، تغییر درصدی، یا سهم از کل.",
      "مقدارها را در فیلدها وارد کنید.",
      "نتیجه و فرمول محاسبه را همان لحظه ببینید.",
    ],
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
    steps: [
      "قیمت اصلی و درصد تخفیف را وارد کنید.",
      "اگر مالیات بر ارزش افزوده هم دارید، درصد آن را اضافه کنید.",
      "قیمت نهایی، مقدار تخفیف و مبلغ مالیات را ببینید و کپی کنید.",
    ],
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
    steps: [
      "تاریخ تولد را با انتخاب سال، ماه و روز وارد کنید (تاریخ شمسی یا میلادی).",
      "تاریخ مبدأ محاسبه را امروز بگذارید یا خودتان انتخاب کنید.",
      "سن دقیق را به سال، ماه و روز ببینید.",
    ],
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
    steps: [
      "تصویر را انتخاب کنید یا داخل کادر بکشید و رها کنید؛ فایلی آپلود نمی‌شود.",
      "عرض و ارتفاع دلخواه را وارد کنید یا نسبت ابعاد را قفل کنید.",
      "خروجی را با فرمت و کیفیت دلخواه دانلود کنید و حجم قبل و بعد را مقایسه کنید.",
    ],
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
    steps: [
      "تصویر (JPG، PNG یا WebP) را انتخاب کنید.",
      "سطح کیفیت را با اسلایدر تنظیم کنید؛ پیش‌نمایش و حجم تقریبی هم‌زمان به‌روز می‌شود.",
      "تصویر فشرده‌شده را دانلود کنید؛ هیچ فایلی از دستگاه شما خارج نمی‌شود.",
    ],
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
  {
    id: "image-to-pdf",
    slug: "image-to-pdf",
    title: "تبدیل عکس به PDF",
    description:
      "چند تصویر را انتخاب کنید، ترتیبشان را مشخص کنید و همگی را در یک فایل PDF به‌همراه تنظیم اندازهٔ صفحه و حاشیه دانلود کنید.",
    steps: [
      "یک یا چند تصویر را انتخاب کنید؛ ترتیب صفحه‌ها را می‌توانید جابه‌جا کنید.",
      "اندازهٔ صفحه (A4 یا اندازهٔ خود تصویر) و حاشیه را تعیین کنید.",
      "دکمهٔ «ساخت PDF» را بزنید و فایل نهایی را دانلود کنید.",
    ],
    category: "files",
    icon: FileText,
    seoTitle: "تبدیل عکس به PDF آنلاین رایگان",
    seoDescription:
      "تصاویر JPG، PNG و WebP را در مرورگر خود به یک فایل PDF تبدیل کنید؛ انتخاب ترتیب صفحه‌ها، اندازهٔ A4 یا هم‌اندازهٔ تصویر و حاشیهٔ دلخواه، بدون آپلود فایل.",
    keywords: [
      "تبدیل عکس به pdf",
      "تبدیل تصویر به pdf",
      "عکس به پی دی اف",
      "jpg to pdf",
      "image to pdf",
      "ادغام عکس در pdf",
    ],
    status: "live",
    popular: true,
    addedAt: "2025-11-15",
  },
  {
    id: "pdf-to-image",
    slug: "pdf-to-image",
    title: "تبدیل PDF به عکس",
    description:
      "صفحه‌های فایل PDF را به تصویر JPG یا PNG تبدیل کنید؛ انتخاب بازهٔ صفحه‌ها، کیفیت خروجی و دانلود تکی یا ZIP.",
    steps: [
      "فایل PDF را انتخاب کنید (همهٔ پردازش در مرورگر انجام می‌شود).",
      "صفحه‌های موردنظر و کیفیت/مقیاس خروجی را انتخاب کنید.",
      "هر صفحه را به‌صورت تصویر PNG یا JPG دانلود کنید.",
    ],
    category: "files",
    icon: FileImage,
    seoTitle: "تبدیل PDF به عکس JPG و PNG آنلاین",
    seoDescription:
      "هر صفحه از فایل PDF را به تصویر JPG یا PNG تبدیل کنید و با کیفیت دلخواه (تا ۲۱۶ dpi) دانلود کنید؛ پردازش کاملاً در مرورگر و بدون آپلود فایل.",
    keywords: [
      "تبدیل pdf به عکس",
      "pdf به jpg",
      "pdf به png",
      "پی دی اف به تصویر",
      "pdf to image",
      "pdf to jpg",
      "استخراج عکس از pdf",
    ],
    status: "live",
    popular: true,
    addedAt: "2025-11-15",
  },
  // ---------------------------------------------------------------- files
  {
    id: "pdf-compressor",
    slug: "pdf-compressor",
    title: "فشرده‌سازی PDF",
    description:
      "حجم فایل PDF را کم کنید؛ دو روش: بهینه‌سازی بدون افت کیفیت یا تبدیل صفحه‌ها به تصویر برای بیشترین کاهش حجم.",
    steps: [
      "فایل PDF را انتخاب کنید.",
      "سطح فشرده‌سازی را انتخاب کنید (کیفیت بالاتر = حجم بیشتر).",
      "فایل سبک‌شده را دانلود کنید و حجم قبل و بعد را مقایسه کنید.",
    ],
    category: "files",
    icon: Minimize2,
    seoTitle: "فشرده‌سازی PDF آنلاین رایگان",
    seoDescription:
      "حجم فایل PDF را در مرورگر خود کم کنید: بهینه‌سازی بدون افت کیفیت یا فشرده‌سازی تصویری با کیفیت دلخواه. بدون آپلود فایل و بدون ثبت‌نام.",
    keywords: [
      "فشرده سازی pdf",
      "کم کردن حجم pdf",
      "compress pdf",
      "کاهش حجم پی دی اف",
      "بهینه سازی pdf",
    ],
    status: "live",
    popular: true,
    addedAt: "2025-11-16",
  },
  {
    id: "pdf-merger",
    slug: "pdf-merger",
    title: "ادغام PDF",
    description:
      "چند فایل PDF را با ترتیب دلخواه در یک فایل ادغام کنید؛ کیفیت اصلی صفحه‌ها حفظ می‌شود.",
    steps: [
      "دو یا چند فایل PDF را انتخاب کنید.",
      "با دکمه‌های جابه‌جایی، ترتیب فایل‌ها را مشخص کنید.",
      "دکمهٔ «ادغام» را بزنید و یک PDF یکپارچه دانلود کنید.",
    ],
    category: "files",
    icon: Layers,
    seoTitle: "ادغام فایل‌های PDF آنلاین رایگان",
    seoDescription:
      "چند فایل PDF را در مرورگر خود به یک فایل ادغام کنید؛ تغییر ترتیب فایل‌ها، حفظ کیفیت اصلی و بدون آپلود به سرور.",
    keywords: ["ادغام pdf", "ترکیب pdf", "merge pdf", "یکی کردن پی دی اف", "چند pdf در یک فایل"],
    status: "live",
    popular: true,
    addedAt: "2025-11-16",
  },
  // --------------------------------------------------------------- images
  {
    id: "image-format-converter",
    slug: "image-format-converter",
    title: "تبدیل JPG به PNG",
    description:
      "قالب تصویر را بین JPG، PNG و WebP تبدیل کنید؛ با تنظیم کیفیت و مقایسهٔ حجم قبل و بعد.",
    steps: [
      "تصویر را انتخاب کنید (JPG، PNG یا WebP).",
      "قالب خروجی و کیفیت را انتخاب کنید.",
      "تصویر تبدیل‌شده را دانلود کنید؛ کیفیت و حجم قبل و بعد نمایش داده می‌شود.",
    ],
    category: "images",
    icon: ArrowLeftRight,
    seoTitle: "تبدیل JPG به PNG و برعکس آنلاین",
    seoDescription:
      "تصاویر JPG، PNG و WebP را در مرورگر خود به هم تبدیل کنید؛ انتخاب کیفیت، پیش‌نمایش و مقایسهٔ حجم — بدون آپلود فایل.",
    keywords: [
      "تبدیل jpg به png",
      "تبدیل png به jpg",
      "jpg to png",
      "png to jpg",
      "تبدیل قالب تصویر",
      "webp converter",
    ],
    status: "live",
    popular: false,
    addedAt: "2025-11-16",
  },
  {
    id: "image-to-base64",
    slug: "image-to-base64",
    title: "تبدیل عکس به Base64",
    description:
      "تصویر را به رشتهٔ Base64 تبدیل کنید و در قالب خالص، data URI، CSS یا تگ <img> کپی کنید.",
    steps: [
      "تصویر را انتخاب کنید.",
      "کد Base64 و data URI آماده (مناسب CSS و تگ img) را ببینید.",
      "کد را کپی کنید یا فایل متنی را دانلود کنید.",
    ],
    category: "images",
    icon: Binary,
    seoTitle: "تبدیل عکس به Base64 آنلاین",
    seoDescription:
      "تصویر خود را به Base64 تبدیل کنید و به‌صورت data URI یا CSS کپی کنید؛ پردازش در مرورگر و بدون آپلود تصویر.",
    keywords: [
      "عکس به base64",
      "image to base64",
      "تبدیل تصویر به base64",
      "data uri",
      "base64 image",
    ],
    status: "live",
    popular: false,
    addedAt: "2025-11-16",
  },
  {
    id: "profile-picture",
    slug: "profile-picture",
    title: "ساخت تصویر پروفایل",
    description:
      "عکس خود را برش دهید، بزرگ‌نمایی کنید و با شکل و پس‌زمینهٔ دلخواه در اندازهٔ دقیق (۲۰۰ تا ۱۰۲۴ پیکسل) ذخیره کنید.",
    steps: [
      "عکس خود را انتخاب کنید؛ پیش‌نمایش دایره‌ای را می‌بینید.",
      "با اسلایدر بزرگ‌نمایی کنید و عکس را در کادر جابه‌جا کنید.",
      "اندازهٔ خروجی (تا ۲۰۰۰ پیکسل) را انتخاب و تصویر پروفایل را دانلود کنید.",
    ],
    category: "images",
    icon: UserRound,
    seoTitle: "ساخت عکس پروفایل با اندازه دلخواه",
    seoDescription:
      "عکس پروفایل خود را با اندازهٔ دقیق بسازید: برش مربع، بزرگ‌نمایی، شکل دایره یا گوشه‌گرد و پس‌زمینهٔ دلخواه؛ رایگان و بدون آپلود.",
    keywords: [
      "عکس پروفایل",
      "ساخت عکس پروفایل",
      "برش عکس",
      "profile picture maker",
      "تغییر اندازه عکس پروفایل",
    ],
    status: "live",
    popular: false,
    addedAt: "2025-11-16",
  },
  // -------------------------------------------------------------- numbers
  {
    id: "loan-calculator",
    slug: "loan-calculator",
    title: "محاسبه اقساط وام",
    description:
      "قسط ماهانهٔ وام را بر اساس مبلغ، نرخ سود سالانه و مدت بازپرداخت محاسبه کنید؛ همراه با جدول کامل بازپرداخت.",
    steps: [
      "مبلغ وام، نرخ سود سالانه و مدت بازپرداخت (به ماه) را وارد کنید.",
      "نوع اقساط (ساده یا با محاسبهٔ دقیق) را انتخاب کنید.",
      "مبلغ قسط ماهانه، کل سود و کل بازپرداخت را ببینید و جدول اقساط را بررسی کنید.",
    ],
    category: "numbers",
    icon: Banknote,
    seoTitle: "محاسبه اقساط وام آنلاین",
    seoDescription:
      "قسط ماهانهٔ وام و مجموع سود را با مبلغ، نرخ سود و مدت بازپرداخت محاسبه کنید؛ همراه با جدول تفکیکی اقساط — رایگان و بدون ثبت‌نام.",
    keywords: [
      "محاسبه اقساط وام",
      "محاسبه قسط",
      "loan calculator",
      "جدول بازپرداخت وام",
      "سود وام",
    ],
    status: "live",
    popular: true,
    addedAt: "2025-11-16",
  },
  {
    id: "bmi-calculator",
    slug: "bmi-calculator",
    title: "محاسبه BMI",
    description:
      "شاخص توده بدنی را با وزن و قد محاسبه کنید و محدودهٔ وزن سالم و وزن ایده‌آل خود را ببینید.",
    steps: [
      "قد (سانتی‌متر) و وزن (کیلوگرم) خود را وارد کنید.",
      "نتیجه به‌صورت عدد BMI و وضعیت (کم‌وزن، نرمال، اضافه‌وزن، چاق) نمایش داده می‌شود.",
      "وزن سالم متناسب با قد خود را هم ببینید.",
    ],
    category: "numbers",
    icon: HeartPulse,
    seoTitle: "محاسبه BMI (شاخص توده بدنی)",
    seoDescription:
      "شاخص توده بدنی (BMI) خود را با وزن و قد محاسبه کنید؛ همراه با دسته‌بندی لاغری/نرمال/اضافه وزن و محدودهٔ وزن سالم — رایگان.",
    keywords: ["محاسبه bmi", "شاخص توده بدنی", "bmi calculator", "قد و وزن", "وزن ایده‌آل"],
    status: "live",
    popular: false,
    addedAt: "2025-11-16",
  },
  {
    id: "date-diff",
    slug: "date-diff",
    title: "محاسبه اختلاف دو تاریخ",
    description:
      "فاصلهٔ بین دو تاریخ شمسی را به سال، ماه، روز، هفته و ساعت محاسبه کنید؛ همراه با روز هفتهٔ هر تاریخ.",
    steps: [
      "تاریخ شروع و پایان را با سال، ماه و روز شمسی وارد کنید.",
      "اگر می‌خواهید روزهای کاری حساب شود، گزینهٔ حذف تعطیلات را فعال کنید.",
      "فاصلهٔ دقیق را به سال، ماه و روز — و همچنین تعداد کل روزها — ببینید.",
    ],
    category: "numbers",
    icon: CalendarRange,
    seoTitle: "محاسبه اختلاف دو تاریخ شمسی",
    seoDescription:
      "اختلاف بین دو تاریخ شمسی را دقیق به سال، ماه، روز، هفته و ساعت محاسبه کنید؛ روز هفته و تعداد روزها — رایگان و بدون ثبت‌نام.",
    keywords: [
      "اختلاف دو تاریخ",
      "محاسبه فاصله دو تاریخ",
      "date difference",
      "تاریخ شمسی",
      "چند روز گذشته",
    ],
    status: "live",
    popular: false,
    addedAt: "2025-11-16",
  },
  {
    id: "exact-age",
    slug: "exact-age",
    title: "محاسبه سن دقیق",
    description:
      "سن خود را تا همین لحظه به سال، ماه، روز، ساعت و دقیقه ببینید؛ با برج، روز هفته و شمارش تا تولد بعدی.",
    steps: [
      "تاریخ تولد و (در صورت نیاز) تاریخ مبدأ را انتخاب کنید.",
      "دکمهٔ محاسبه را بزنید.",
      "سن دقیق، روزهای باقی‌مانده تا تولد بعدی و تعداد کل روزهای عمر را ببینید.",
    ],
    category: "numbers",
    icon: CalendarClock,
    seoTitle: "محاسبه سن دقیق با ساعت تولد",
    seoDescription:
      "سن دقیق خود را با تاریخ و ساعت تولد شمسی محاسبه کنید: سال، ماه، روز، ساعت و دقیقه، مجموع روزها، برج و روز هفته.",
    keywords: [
      "محاسبه سن دقیق",
      "سن با ساعت",
      "exact age calculator",
      "تاریخ تولد شمسی",
      "چند روز زنده ام",
    ],
    status: "live",
    popular: false,
    addedAt: "2025-11-16",
  },
  // ------------------------------------------------------------------ dev
  {
    id: "qr-code-generator",
    slug: "qr-code-generator",
    title: "تولید QR Code",
    description:
      "برای متن، لینک، وای‌فای، شماره تماس یا ایمیل کد QR بسازید و آن را با کیفیت بالا به‌صورت PNG دانلود کنید.",
    steps: [
      "متن، لینک یا شمارهٔ تماس موردنظر را وارد کنید.",
      "اندازه و حاشیهٔ کد را تنظیم کنید.",
      "کد QR را با کیفیت بالا (PNG) دانلود کنید.",
    ],
    category: "dev",
    icon: QrCode,
    seoTitle: "ساخت کد QR آنلاین رایگان",
    seoDescription:
      "کد QR برای لینک، متن، وای‌فای یا شماره تماس بسازید و به‌صورت PNG دانلود کنید؛ انتخاب اندازه، رنگ و سطح مقاومت در برابر خطا.",
    keywords: ["تولید qr code", "ساخت کد qr", "qr generator", "کیو آر کد", "qr وای فای"],
    status: "live",
    popular: true,
    addedAt: "2025-11-16",
  },
  {
    id: "json-formatter",
    slug: "json-formatter",
    title: "JSON Formatter و اعتبارسنجی",
    description:
      "متن JSON را مرتب، فشرده یا اعتبارسنجی کنید؛ خطاها با شماره خط و ستون نمایش داده می‌شوند.",
    steps: [
      "JSON خود را در کادر بچسبانید.",
      "دکمهٔ «قالب‌بندی» یا «فشرده‌سازی» را بزنید؛ خطاهای ساختاری با شمارهٔ خط نشان داده می‌شوند.",
      "خروجی مرتب را کپی کنید.",
    ],
    category: "dev",
    icon: Braces,
    seoTitle: "فرمت و اعتبارسنجی JSON آنلاین",
    seoDescription:
      "JSON خود را مرتب‌سازی، فشرده یا اعتبارسنجی کنید؛ نمایش خطا با شماره خط و ستون، تعمیر خودکار و مرتب‌سازی کلیدها — در مرورگر شما.",
    keywords: [
      "json formatter",
      "json validator",
      "مرتب سازی json",
      "اعتبارسنجی json",
      "json beautifier",
    ],
    status: "live",
    popular: true,
    addedAt: "2025-11-16",
  },
  {
    id: "base64-encoder",
    slug: "base64-encoder",
    title: "Base64 Encoder / Decoder",
    description:
      "متن را به Base64 تبدیل کنید و برعکس؛ با پشتیبانی کامل از فارسی و گزینهٔ URL-safe.",
    steps: [
      "متن یا فایل را انتخاب کنید.",
      "حالت «کدگذاری» یا «کدگشایی» را انتخاب کنید (پشتیبانی از UTF-8 فارسی).",
      "نتیجه را کپی کنید.",
    ],
    category: "dev",
    icon: Binary,
    seoTitle: "تبدیل متن به Base64 و برعکس",
    seoDescription:
      "متن را به Base64 کدگذاری یا از Base64 رمزگشایی کنید؛ پشتیبانی از متن فارسی (UTF-8)، حالت URL-safe و کپی سریع.",
    keywords: [
      "base64 encoder",
      "base64 decoder",
      "تبدیل به base64",
      "رمزگشایی base64",
      "base64 آنلاین",
    ],
    status: "live",
    popular: false,
    addedAt: "2025-11-16",
  },
  {
    id: "url-encoder",
    slug: "url-encoder",
    title: "URL Encoder / Decoder",
    description:
      "لینک یا متن را برای استفاده در URL کدگذاری کنید و رشته‌های کدگذاری‌شده را رمزگشایی کنید.",
    steps: [
      "آدرس یا متن را در کادر بچسبانید.",
      "حالت encode یا decode را انتخاب کنید.",
      "خروجی سازگار با URL را کپی کنید.",
    ],
    category: "dev",
    icon: Link2,
    seoTitle: "کدگذاری و رمزگشایی URL آنلاین",
    seoDescription:
      "لینک یا متن را به فرمت URL کدگذاری (encodeURIComponent / encodeURI) یا از آن رمزگشایی کنید؛ رایگان و در مرورگر شما.",
    keywords: [
      "url encoder",
      "url decoder",
      "کدگذاری url",
      "رمزگشایی url",
      "encodeuricomponent",
      "percent encoding",
    ],
    status: "live",
    popular: false,
    addedAt: "2025-11-16",
  },

  /* ---------------------------------------------------------------- */
  /*  Phase 5 — package A (12 new tools)                              */
  /* ---------------------------------------------------------------- */
  {
    id: "duplicate-line-remover",
    slug: "duplicate-line-remover",
    title: "حذف خطوط تکراری",
    description:
      "خطوط تکراری متن را حذف کنید و ترتیب اولین تکرارها را نگه دارید؛ مناسب لیست‌ها، شماره‌ها و فهرست‌های بلند.",
    steps: [
      "فهرست خود را در کادر بچسبانید؛ هر خط یک آیتم است.",
      "گزینه‌ها را انتخاب کنید: نادیده‌گرفتن حروف بزرگ/کوچک، فاصله‌های اضافی و حذف خطوط خالی.",
      "خروجی یکتا را کپی کنید یا فایل متنی را دانلود کنید.",
    ],
    category: "text",
    icon: ListFilter,
    seoTitle: "حذف خطوط تکراری آنلاین",
    seoDescription:
      "خطوط تکراری متن یا لیست را به‌صورت آنلاین حذف کنید؛ ترتیب اصلی حفظ می‌شود و همه‌چیز در مرورگر شما انجام می‌شود.",
    keywords: ["حذف تکراری", "حذف خطوط تکراری", "remove duplicates", "لیست بدون تکرار", "یونیک کردن لیست"],
    status: "live",
    popular: false,
    addedAt: "2025-11-14",
  },
  {
    id: "line-sorter",
    slug: "line-sorter",
    title: "مرتب‌سازی خطوط",
    description:
      "خطوط متن را الفبایی (فارسی)، بر اساس طول یا تصادفی مرتب کنید؛ با امکان معکوس کردن ترتیب.",
    steps: [
      "خطوط را در کادر وارد کنید (هر خط یک آیتم).",
      "نوع مرتب‌سازی را انتخاب کنید: الفبایی، طولانی‌ترین، کوتاه‌ترین، تصادفی یا معکوس.",
      "خروجی را کپی کنید یا فایل متنی را دانلود کنید.",
    ],
    category: "text",
    icon: ArrowDownUp,
    seoTitle: "مرتب‌سازی خطوط متن آنلاین",
    seoDescription:
      "خطوط متن را الفبایی فارسی، بر اساس طول یا تصادفی مرتب کنید؛ رایگان، بدون نصب و با پردازش در مرورگر.",
    keywords: ["مرتب سازی خطوط", "sort lines", "مرتب کردن متن", "شuffle لیست", "الفبایی کردن"],
    status: "live",
    popular: false,
    addedAt: "2025-11-14",
  },
  {
    id: "keyword-density",
    slug: "keyword-density",
    title: "چگالی و تکرار کلمات کلیدی",
    description:
      "پرتکرارترین کلمات متن و چگالی آن‌ها را ببینید؛ ابزار کاربردی برای سئو و ویرایش محتوا.",
    steps: [
      "متن مقاله یا توضیحات محصول را بچسبانید.",
      "کلمات پرتکرار، تعداد و درصد چگالی هر کدام را ببینید.",
      "کلمات ربط را با یک کلیک حذف کنید تا فقط کلمات کلیدی واقعی بمانند.",
    ],
    category: "text",
    icon: ChartColumn,
    seoTitle: "محاسبه چگالی کلمات کلیدی فارسی",
    seoDescription:
      "تکرار کلمات و چگالی کلمات کلیدی متن فارسی را اندازه بگیرید؛ نیم‌فاصله و «ی/ک» عربی یکسان‌سازی می‌شود.",
    keywords: ["چگالی کلمات کلیدی", "keyword density", "تکرار کلمات", "سئو متن", "شمارش کلمات پرتکرار"],
    status: "live",
    popular: false,
    addedAt: "2025-11-14",
  },
  {
    id: "slug-generator",
    slug: "slug-generator",
    title: "ساخت اسلاگ (آدرس صفحه)",
    description:
      "از عنوان فارسی، اسلاگ انگلیسی یا فارسی بسازید؛ مناسب آدرس پست وبلاگ، محصول و دسته‌بندی.",
    steps: [
      "عنوان پست یا محصول را بنویسید.",
      "انتخاب کنید اسلاگ انگلیسی (حروف لاتین) باشد یا فارسی، و جداکننده را مشخص کنید.",
      "اسلاگ نهایی را کپی کنید؛ پیش‌نمایش آدرس هم نمایش داده می‌شود.",
    ],
    category: "text",
    icon: Link2,
    seoTitle: "ساخت اسلاگ فارسی و انگلیسی",
    seoDescription:
      "از عنوان فارسی، اسلاگ استاندارد بسازید (ترنسلیت به لاتین یا نگه‌داشتن حروف فارسی)؛ مناسب سئو و آدرس‌های خوانا.",
    keywords: ["اسلاگ", "slug generator", "ساخت اسلاگ فارسی", "آدرس صفحه", "permalink"],
    status: "live",
    popular: false,
    addedAt: "2025-11-14",
  },
  {
    id: "date-converter",
    slug: "date-converter",
    title: "تبدیل تاریخ شمسی و میلادی",
    description:
      "تاریخ شمسی را به میلادی و میلادی را به شمسی تبدیل کنید؛ با روز هفته و فرمت استاندارد ISO.",
    steps: [
      "جهت تبدیل را انتخاب کنید: شمسی ← میلادی یا میلادی ← شمسی.",
      "سال، ماه و روز را از منوها انتخاب کنید.",
      "تاریخ معادل، روز هفته و فرمت ISO را ببینید و کپی کنید.",
    ],
    category: "numbers",
    icon: CalendarSync,
    seoTitle: "تبدیل تاریخ شمسی به میلادی و برعکس",
    seoDescription:
      "تاریخ شمسی و میلادی را دقیق و سریع به هم تبدیل کنید؛ همراه با روز هفته و فرمت ISO. رایگان و بدون ثبت‌نام.",
    keywords: ["تبدیل تاریخ شمسی به میلادی", "تاریخ میلادی به شمسی", "jalali to gregorian", "تبدیل تاریخ", "تقویم شمسی"],
    status: "live",
    popular: true,
    addedAt: "2025-11-14",
  },
  {
    id: "unit-converter",
    slug: "unit-converter",
    title: "تبدیل واحد (طول، وزن، دما…)",
    description:
      "واحدهای طول، وزن، دما، مساحت، حجم، سرعت و حجم داده را هم‌زمان تبدیل کنید.",
    steps: [
      "دستهٔ واحد را انتخاب کنید (طول، وزن، دما، مساحت، حجم، سرعت، داده).",
      "مقدار و واحد مبدأ را وارد کنید؛ واحد مقصد را انتخاب یا با دکمهٔ جابه‌جایی عوض کنید.",
      "نتیجه و جدول همهٔ واحدهای همان دسته را ببینید.",
    ],
    category: "numbers",
    icon: Ruler,
    seoTitle: "تبدیل واحد آنلاین (طول، وزن، دما، مساحت)",
    seoDescription:
      "تبدیل واحدهای طول، وزن، دما، مساحت، حجم، سرعت و حجم داده به‌صورت آنلاین و دقیق؛ رایگان و بدون نصب.",
    keywords: ["تبدیل واحد", "unit converter", "متر به فوت", "کیلوگرم به پوند", "سانتی‌گراد به فارنهایت"],
    status: "live",
    popular: false,
    addedAt: "2025-11-14",
  },
  {
    id: "bank-interest",
    slug: "bank-interest",
    title: "محاسبه سود بانکی",
    description:
      "سود ساده و مرکب سپردهٔ بانکی را با نرخ سالانه و مدت دلخواه حساب کنید.",
    steps: [
      "نوع محاسبه را انتخاب کنید: سود ساده یا سود مرکب.",
      "مبلغ سپرده، نرخ سود سالانه و مدت (ماه) را وارد کنید.",
      "سود کل، مبلغ نهایی، سود ماهانه و نرخ مؤثر سالانه را ببینید.",
    ],
    category: "numbers",
    icon: Landmark,
    seoTitle: "محاسبه سود بانکی (ساده و مرکب)",
    seoDescription:
      "سود سپردهٔ بانکی را با نرخ سالانه و مدت دلخواه محاسبه کنید؛ سود ساده و مرکب، همراه با نرخ مؤثر سالانه.",
    keywords: ["سود بانکی", "محاسبه سود سپرده", "سود مرکب", "bank interest", "نرخ سود"],
    status: "live",
    popular: false,
    addedAt: "2025-11-14",
  },
  {
    id: "heic-to-jpg",
    slug: "heic-to-jpg",
    title: "تبدیل HEIC به JPG",
    description:
      "عکس‌های HEIC آیفون را به JPG تبدیل کنید تا در همهٔ دستگاه‌ها و سایت‌ها باز شوند.",
    steps: [
      "عکس‌های HEIC/HEIF را انتخاب کنید (چند فایل هم‌زمان مجاز است).",
      "کیفیت خروجی JPG را با اسلایدر تنظیم کنید.",
      "هر عکس را جداگانه دانلود کنید؛ فایل‌ها هرگز آپلود نمی‌شوند.",
    ],
    category: "images",
    icon: Images,
    seoTitle: "تبدیل HEIC به JPG آنلاین",
    seoDescription:
      "عکس HEIC آیفون را بدون نصب برنامه به JPG تبدیل کنید؛ پردازش کامل در مرورگر و بدون آپلود فایل.",
    keywords: ["تبدیل HEIC به JPG", "heic to jpg", "عکس آیفون", "HEIF", "تبدیل عکس آیفون"],
    status: "live",
    popular: true,
    addedAt: "2025-11-14",
  },
  {
    id: "pdf-rotate",
    slug: "pdf-rotate",
    title: "چرخاندن صفحات PDF",
    description:
      "صفحات PDF را ۹۰، ۱۸۰ یا ۲۷۰ درجه بچرخانید؛ بدون افت کیفیت و بدون آپلود.",
    steps: [
      "فایل PDF را انتخاب کنید.",
      "زاویهٔ چرخش را مشخص کنید (۹۰، ۱۸۰ یا ۲۷۰ درجه).",
      "اگر فقط بعضی صفحات را می‌خواهید، شمارهٔ آن‌ها را وارد کنید و فایل را دانلود کنید.",
    ],
    category: "files",
    icon: RotateCw,
    seoTitle: "چرخاندن صفحات PDF آنلاین",
    seoDescription:
      "صفحات PDF را ۹۰/۱۸۰/۲۷۰ درجه بچرخانید؛ کیفیت و متن صفحه حفظ می‌شود و فایل در مرورگر شما پردازش می‌شود.",
    keywords: ["چرخاندن PDF", "rotate pdf", "صفحات افقی PDF", "درست کردن جهت PDF"],
    status: "live",
    popular: false,
    addedAt: "2025-11-14",
  },
  {
    id: "pdf-delete-pages",
    slug: "pdf-delete-pages",
    title: "حذف صفحه از PDF",
    description:
      "صفحه‌های اضافی PDF را حذف کنید و فایل تمیز تحویل بگیرید؛ بدون آپلود به سرور.",
    steps: [
      "فایل PDF را انتخاب کنید و تعداد صفحات آن را ببینید.",
      "شمارهٔ صفحه‌های موردنظر برای حذف را وارد کنید (مثال: 1-3, 5).",
      "فایل جدید را دانلود کنید؛ بقیهٔ صفحات بدون تغییر می‌مانند.",
    ],
    category: "files",
    icon: Trash2,
    seoTitle: "حذف صفحه از PDF آنلاین",
    seoDescription:
      "صفحه‌های اضافی فایل PDF را حذف کنید؛ پردازش کاملاً در مرورگر انجام می‌شود و کیفیت صفحات حفظ می‌شود.",
    keywords: ["حذف صفحه PDF", "delete pdf pages", "پاک کردن صفحه از پی دی اف", "ویرایش PDF"],
    status: "live",
    popular: false,
    addedAt: "2025-11-14",
  },
  {
    id: "pdf-split",
    slug: "pdf-split",
    title: "استخراج و تقسیم صفحات PDF",
    description:
      "از یک PDF، صفحه‌های دلخواه را استخراج کنید یا فایل را به بخش‌های کوچک‌تر تقسیم کنید.",
    steps: [
      "فایل PDF را انتخاب کنید.",
      "بازهٔ صفحه‌ها را وارد کنید (مثال: 1-3, 5).",
      "فایل جدید شامل همان صفحات را دانلود کنید.",
    ],
    category: "files",
    icon: Scissors,
    seoTitle: "استخراج و تقسیم صفحات PDF",
    seoDescription:
      "صفحه‌های دلخواه یک PDF را جدا کنید یا فایل را تقسیم کنید؛ رایگان، بدون نصب و با پردازش در مرورگر.",
    keywords: ["تقسیم PDF", "split pdf", "استخراج صفحه PDF", "جدا کردن صفحات"],
    status: "live",
    popular: false,
    addedAt: "2025-11-14",
  },
  {
    id: "jwt-decoder",
    slug: "jwt-decoder",
    title: "رمزگشایی JWT",
    description:
      "هدر و payload توکن JWT را بخوانید و وضعیت انقضا را ببینید؛ امضا بررسی نمی‌شود.",
    steps: [
      "توکن JWT را در کادر بچسبانید (کلمهٔ Bearer هم پذیرفته می‌شود).",
      "هدر و payload را به‌صورت JSON مرتب ببینید.",
      "وضعیت انقضا (exp) و زمان صدور (iat) را بررسی کنید.",
    ],
    category: "dev",
    icon: KeyRound,
    seoTitle: "رمزگشایی JWT آنلاین",
    seoDescription:
      "توکن JWT را در مرورگر خودتان رمزگشایی کنید و هدر، payload و تاریخ انقضا را ببینید؛ هیچ داده‌ای ارسال نمی‌شود.",
    keywords: ["jwt decoder", "رمزگشایی JWT", "توکن JWT", "decode jwt", "jwt payload"],
    status: "live",
    popular: false,
    addedAt: "2025-11-14",
  },
  {
    id: "hash-generator",
    slug: "hash-generator",
    title: "تولید هش و UUID",
    description:
      "هش MD5، SHA-1، SHA-256، SHA-384 و SHA-512 بسازید و UUID نسخهٔ ۴ تولید کنید.",
    steps: [
      "متن موردنظر را وارد کنید؛ هش هر پنج الگوریتم هم‌زمان محاسبه می‌شود.",
      "هش موردنظر را کپی کنید.",
      "برای شناسهٔ یکتا، تعداد و تعداد UUID را انتخاب و تولید کنید.",
    ],
    category: "dev",
    icon: Fingerprint,
    seoTitle: "تولید هش (MD5, SHA-256) و UUID",
    seoDescription:
      "هش MD5 و SHA-1/256/384/512 از متن بسازید و UUID v4 تولید کنید؛ همه در مرورگر و بدون ارسال داده.",
    keywords: ["md5", "sha256", "hash generator", "uuid v4", "تولید هش"],
    status: "live",
    popular: false,
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

/** Every category a tool belongs to, primary first. */
export function categoriesOf(tool: Tool): string[] {
  return [tool.category, ...(tool.alsoIn ?? [])];
}

/** Does this tool belong to the given category (primary or secondary)? */
export function isInCategory(tool: Tool, categorySlug: string): boolean {
  return categoriesOf(tool).includes(categorySlug);
}

export function getToolsByCategory(categorySlug: string): Tool[] {
  return tools.filter((tool) => isInCategory(tool, categorySlug));
}

export function countToolsInCategory(categorySlug: string): number {
  return getToolsByCategory(categorySlug).length;
}
