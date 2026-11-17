import {
  ArrowDownUp,
  AudioLines,
  Crop,
  ArrowLeftRight,
  BadgePercent,
  Banknote,
  Binary,
  Braces,
  CalendarClock,
  CalendarDays,
  CalendarSync,
  ChartColumn,
  Eraser,
  FileImage,
  FileText,
  Fingerprint,
  Hash,
  HeartPulse,
  Images,
  Languages,
  Receipt,
  FileSignature,
  FileCheck,
  FilePen,
  KeyRound,
  Landmark,
  Lock,
  LockOpen,
  FileOutput,
  Layers,
  Link2,
  ListFilter,
  Minimize2,
  Percent,
  Package,
  Palette,
  QrCode,
  Replace,
  Ruler,
  Scissors,
  Scaling,
  SpellCheck,
  Type,
  Stamp,
  Video,
  UserRound,
  Wallet,
  type LucideIcon,
  IdCard,
  SearchCheck,
  Tags,
  MonitorSmartphone,
  Share2,
  Heading1,
  Bot,
  Map,
  Image,
  Link,
  ShieldCheck,
  Clock,
  Gem,
  TrendingUp,
  Briefcase,
  Timer,
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
    id: "labour-insurance",
    slug: "labour-insurance",
    title: "محاسبهٔ حق بیمهٔ تأمین اجتماعی",
    description:
      "حق بیمهٔ ماهانه را با سهم کارگر (۷٪) و کارفرما (۲۰٪ + ۳٪ بیکاری) حساب کنید؛ مبنای محاسبه و حداقل مزد سال لحاظ می‌شود.",
    steps: [
      "حقوق ماهانه را وارد کنید و سال را انتخاب کنید.",
      "سهم کارگر، سهم کارفرما و هزینهٔ ماهانهٔ شرکت را ببینید.",
      "اگر حقوق از حداقل مزد کمتر باشد، ابزار همان را مبنا می‌گیرد و اعلام می‌کند.",
    ],
    category: "finance",
    icon: ShieldCheck,
    seoTitle: "محاسبهٔ حق بیمه تأمین اجتماعی ۱۴۰۴ و ۱۴۰۵",
    seoDescription:
      "سهم کارگر و کارفرمای بیمهٔ تأمین اجتماعی را دقیق حساب کنید؛ مبنای حداقل مزد و سهم بیمهٔ بیکاری هم محاسبه می‌شود.",
    keywords: ["محاسبه حق بیمه", "بیمه تامین اجتماعی", "حقوق و دستمزد", "محاسبه آنلاین"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "labour-overtime",
    slug: "labour-overtime",
    title: "محاسبهٔ اضافه‌کاری و شب‌کاری",
    description:
      "مزد ساعتی از حقوق ماهانه (÷۲۲۰) و بعد اضافه‌کاری ۱٫۴ برابر و شب‌کاری ۱٫۳۵ برابر؛ جمع کل در یک نگاه.",
    steps: [
      "حقوق ماهانه و ساعت‌های اضافه‌کاری را وارد کنید.",
      "ساعت شب‌کاری (۲۲ تا ۶) را هم اگر دارید بنویسید.",
      "مزد ساعتی، مبلغ اضافه‌کاری و جمع کل را ببینید.",
    ],
    category: "finance",
    icon: Clock,
    seoTitle: "محاسبهٔ اضافه‌کاری و شب‌کاری طبق قانون کار",
    seoDescription:
      "مبلغ اضافه‌کاری و شب‌کاری را با مزد ساعتی درست (مادهٔ ۵۹ و ۵۸ قانون کار) حساب کنید.",
    keywords: ["محاسبه اضافه کاری", "اضافه کاری قانون کار", "حقوق و دستمزد", "محاسبه آنلاین"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "labour-leave-pay",
    slug: "labour-leave-pay",
    title: "محاسبهٔ حقوق مرخصی",
    description:
      "حقوق روزهای مرخصی استحقاقی با حق مسکن و بن؛ ماندهٔ مرخصی سالانه هم حساب می‌شود.",
    steps: [
      "حقوق ماهانه را وارد کنید.",
      "تعداد روزهای مرخصی و مرخصی استفاده‌شده تا امروز را بنویسید.",
      "حقوق مرخصی و ماندهٔ روزها را ببینید.",
    ],
    category: "finance",
    icon: CalendarDays,
    seoTitle: "محاسبهٔ حقوق مرخصی استحقاقی",
    seoDescription:
      "حقوق روزهای مرخصی را با مزد روزانه (شامل حق مسکن و بن) و ماندهٔ ۳۰ روز مرخصی سالانه حساب کنید.",
    keywords: ["حقوق مرخصی", "مرخصی استحقاقی", "حقوق و دستمزد", "محاسبه آنلاین"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "labour-mahr",
    slug: "labour-mahr",
    title: "محاسبهٔ مهریه به سکه",
    description:
      "مهریهٔ نقدی را با نرخ سکهٔ روز به سکهٔ تمام‌بهار و گرم طلا تبدیل کنید؛ نرخ را خودتان وارد می‌کنید.",
    steps: [
      "مبلغ مهریه را وارد کنید.",
      "نرخ هر سکهٔ تمام‌بهار امروز را بنویسید.",
      "معادل سکه و در صورت وارد کردن نرخ طلا، معادل گرم را ببینید.",
    ],
    category: "finance",
    icon: Gem,
    seoTitle: "محاسبهٔ مهریه به سکهٔ تمام‌بهار",
    seoDescription:
      "مهریه را با نرخ سکهٔ روز به تعداد سکه تبدیل کنید. نرخ را خودتان وارد می‌کنید؛ ابزار قیمت لحظه‌ای استعلام نمی‌کند.",
    keywords: ["محاسبه مهریه", "مهریه سکه", "حقوق و دستمزد", "محاسبه آنلاین"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "labour-vat",
    slug: "labour-vat",
    title: "محاسبهٔ مالیات بر ارزش افزوده",
    description:
      "مالیات ۱۰٪ را به مبلغ اضافه کنید یا از مبلغ ناخالص جدا کنید؛ محاسبهٔ دوطرفه.",
    steps: [
      "مبلغ را وارد کنید.",
      "انتخاب کنید مالیات اضافه شود یا از مبلغ جدا شود.",
      "مبلغ خالص، مالیات و ناخالص را ببینید.",
    ],
    category: "finance",
    icon: Percent,
    seoTitle: "محاسبهٔ مالیات بر ارزش افزوده ۱۰ درصد",
    seoDescription:
      "مالیات بر ارزش افزوده را دوطرفه حساب کنید: افزودن ۱۰٪ به مبلغ یا جدا کردن مالیات از مبلغ ناخالص.",
    keywords: ["مالیات ارزش افزوده", "VAT", "حقوق و دستمزد", "محاسبه آنلاین"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "labour-profit-margin",
    slug: "labour-profit-margin",
    title: "حاشیهٔ سود و نشانه‌گذاری",
    description:
      "تفاوت حاشیهٔ سود (بر مبنای قیمت فروش) و نشانه‌گذاری (بر مبنای قیمت تمام‌شده) را ببینید و قیمت هدف را حساب کنید.",
    steps: [
      "قیمت تمام‌شده و قیمت فروش را وارد کنید.",
      "حاشیهٔ سود هدف را بنویسید تا قیمت لازم را ببینید.",
      "سود، حاشیه و نشانه‌گذاری را مقایسه کنید.",
    ],
    category: "finance",
    icon: TrendingUp,
    seoTitle: "محاسبهٔ حاشیهٔ سود و نشانه‌گذاری (مارک‌آپ)",
    seoDescription:
      "حاشیهٔ سود و مارک‌آپ را با هم ببینید — این دو عدد یکی نیستند — و قیمت فروش لازم برای حاشیهٔ هدف را حساب کنید.",
    keywords: ["حاشیه سود", "مارک آپ", "حقوق و دستمزد", "محاسبه آنلاین"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "labour-hiring-cost",
    slug: "labour-hiring-cost",
    title: "هزینهٔ واقعی استخدام",
    description:
      "حقوق ناخالص + سهم بیمهٔ کارفرما + عیدی + ذخیرهٔ سنوات: عددی که کارفرما باید بودجه بگیرد.",
    steps: [
      "حقوق و مزایای ناخالص ماهانه را وارد کنید.",
      "سال را انتخاب کنید تا سقف عیدی درست محاسبه شود.",
      "هزینهٔ ماهانه و سالانهٔ شرکت را ببینید.",
    ],
    category: "finance",
    icon: Briefcase,
    seoTitle: "محاسبهٔ هزینهٔ واقعی استخدام برای کارفرما",
    seoDescription:
      "هزینهٔ کامل یک کارمند را حساب کنید: حقوق، سهم بیمهٔ کارفرما، عیدی و ذخیرهٔ سنوات.",
    keywords: ["هزینه استخدام", "حقوق و دستمزد", "حقوق و دستمزد", "محاسبه آنلاین"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "labour-late-payment",
    slug: "labour-late-payment",
    title: "خسارت تأخیر تأدیه",
    description:
      "خسارت تأخیر تأدیه را بر مبنای اصل بدهی، تعداد روز و نرخ تورم سالانه حساب کنید.",
    steps: [
      "اصل بدهی و تعداد روزهای تأخیر را وارد کنید.",
      "نرخ تورم سالانه را تنظیم کنید (پیش‌فرض ۱۸٪).",
      "مبلغ خسارت و جمع کل را ببینید.",
    ],
    category: "finance",
    icon: Timer,
    seoTitle: "محاسبهٔ خسارت تأخیر تأدیه",
    seoDescription:
      "خسارت تأخیر تأدیه را بر پایهٔ اصل بدهی و نرخ تورم حساب کنید. نرخ ثابت قانونی نیست و قابل تنظیم است.",
    keywords: ["تاخیر تادیه", "خسارت تاخیر", "حقوق و دستمزد", "محاسبه آنلاین"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
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
    keywords: ["شمارش کلمات", "تعداد کلمات", "word counter", "شمارش واژه", "تعداد واژه", "شمارش کلمه", "word count", "شمارنده کلمه", "چند کلمه است"],
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
    keywords: ["شمارش کاراکتر", "تعداد کاراکتر", "character counter", "شمارش حروف", "شمارش حرف", "character count", "شمارش کاراکتر بدون فاصله"],
    status: "live",
    popular: false,
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
    keywords: ["تبدیل عدد به فارسی", "اعداد فارسی", "persian numbers", "تبدیل ارقام", "اعداد انگلیسی به فارسی", "تبدیل عدد انگلیسی به فارسی", "عدد فارسی به انگلیسی", "ارقام فارسی"],
    status: "live",
    popular: false,
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
    keywords: ["پاک‌سازی متن", "تمیز کردن متن فارسی", "حذف فاصله اضافی", "نیم‌فاصله", "پاک کردن فاصله اضافه", "حذف نیم‌فاصله", "اصلاح متن فارسی", "یکسان‌سازی ی و ک"],
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
    keywords: ["تبدیل عدد به حروف", "عدد به حروف", "number to words", "حروف فارسی", "نوشتن عدد با حروف", "مبلغ به حروف"],
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
    keywords: ["محاسبه درصد", "درصد گیری", "percentage calculator", "درصد عدد", "درصد گرفتن", "چند درصد", "percent"],
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
    category: "finance",
    icon: BadgePercent,
    seoTitle: "محاسبه تخفیف آنلاین رایگان",
    seoDescription:
      "قیمت نهایی بعد از تخفیف و مبلغ تخفیف را بر اساس درصد یا مبلغ ثابت محاسبه کنید؛ سریع و رایگان.",
    keywords: ["محاسبه تخفیف", "قیمت بعد از تخفیف", "discount calculator", "درصد تخفیف", "قیمت با تخفیف", "discount"],
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
    keywords: ["تغییر اندازه تصویر", "resize image", "کوچک کردن عکس", "ابعاد تصویر", "تغییر سایز عکس", "اندازه عکس"],
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
    keywords: ["فشرده‌سازی تصویر", "کم کردن حجم عکس", "compress image", "کاهش حجم تصویر", "فشرده کردن عکس", "حجم عکس"],
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
    keywords: ["تبدیل عکس به pdf", "تبدیل تصویر به pdf", "عکس به پی دی اف", "jpg to pdf", "image to pdf", "ادغام عکس در pdf"],
    status: "live",
    popular: false,
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
    keywords: ["تبدیل pdf به عکس", "pdf به jpg", "pdf به png", "پی دی اف به تصویر", "pdf to image", "pdf to jpg", "استخراج عکس از pdf", "PDF به عکس", "تبدیل پی دی اف به عکس"],
    status: "live",
    popular: false,
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
    keywords: ["فشرده سازی pdf", "کم کردن حجم pdf", "compress pdf", "کاهش حجم پی دی اف", "بهینه سازی pdf", "حجم فایل پی دی اف"],
    status: "live",
    popular: false,
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
    keywords: ["ادغام pdf", "ترکیب pdf", "merge pdf", "یکی کردن پی دی اف", "چند pdf در یک فایل", "چسباندن PDF", "یکی کردن فایل PDF", "ادغام"],
    status: "live",
    popular: false,
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
    keywords: ["تبدیل jpg به png", "تبدیل png به jpg", "jpg to png", "png to jpg", "تبدیل قالب تصویر", "webp converter"],
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
    keywords: ["عکس به base64", "image to base64", "تبدیل تصویر به base64", "data uri", "base64 image"],
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
    keywords: ["عکس پروفایل", "ساخت عکس پروفایل", "برش عکس", "profile picture maker", "تغییر اندازه عکس پروفایل"],
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
    category: "finance",
    icon: Banknote,
    seoTitle: "محاسبه اقساط وام آنلاین",
    seoDescription:
      "قسط ماهانهٔ وام و مجموع سود را با مبلغ، نرخ سود و مدت بازپرداخت محاسبه کنید؛ همراه با جدول تفکیکی اقساط — رایگان و بدون ثبت‌نام.",
    keywords: ["محاسبه اقساط وام", "محاسبه قسط", "loan calculator", "جدول بازپرداخت وام", "سود وام", "اقساط وام", "loan"],
    status: "live",
    popular: false,
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
    keywords: ["محاسبه bmi", "شاخص توده بدنی", "bmi calculator", "قد و وزن", "وزن ایده‌آل", "چاقی"],
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
    keywords: ["محاسبه سن دقیق", "سن با ساعت", "exact age calculator", "تاریخ تولد شمسی", "چند روز زنده ام"],
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
    keywords: ["تولید qr code", "ساخت کد qr", "qr generator", "کیو آر کد", "qr وای فای", "ساخت کیو آر کد", "ساخت QR", "بارکد لینک", "qr ساز"],
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
    keywords: ["json formatter", "json validator", "مرتب سازی json", "اعتبارسنجی json", "json beautifier", "مرتب کردن JSON", "فرمت جیسون", "json beautify"],
    status: "live",
    popular: false,
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
    keywords: ["base64 encoder", "base64 decoder", "تبدیل به base64", "رمزگشایی base64", "base64 آنلاین", "کدگذاری بیس ۶۴", "base64 decode", "دیکد base64"],
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
    keywords: ["url encoder", "url decoder", "کدگذاری url", "رمزگشایی url", "encodeuricomponent", "percent encoding", "url decode", "انکود آدرس"],
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
    keywords: ["تبدیل تاریخ شمسی به میلادی", "تاریخ میلادی به شمسی", "jalali to gregorian", "تبدیل تاریخ", "تقویم شمسی", "تبدیل تاریخ میلادی به شمسی", "date converter"],
    status: "live",
    popular: false,
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
    keywords: ["تبدیل واحد", "unit converter", "متر به فوت", "کیلوگرم به پوند", "سانتی‌گراد به فارنهایت", "کیلو به پوند", "سانتی به اینچ", "unit"],
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
    category: "finance",
    icon: Landmark,
    seoTitle: "محاسبه سود بانکی (ساده و مرکب)",
    seoDescription:
      "سود سپردهٔ بانکی را با نرخ سالانه و مدت دلخواه محاسبه کنید؛ سود ساده و مرکب، همراه با نرخ مؤثر سالانه.",
    keywords: ["سود بانکی", "محاسبه سود سپرده", "سود مرکب", "bank interest", "نرخ سود", "سود سپرده", "interest"],
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
    keywords: ["تقسیم PDF", "split pdf", "استخراج صفحه PDF", "جدا کردن صفحات", "جدا کردن صفحات PDF", "استخراج صفحه"],
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
    keywords: ["jwt decoder", "رمزگشایی JWT", "توکن JWT", "decode jwt", "jwt payload", "دیکد JWT", "توکن"],
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
    keywords: ["md5", "sha256", "hash generator", "uuid v4", "تولید هش", "ساخت هش", "uuid"],
    status: "live",
    popular: false,
    addedAt: "2025-11-14",
  },


  /* ---------------------------------------------------------------- */
  /*  Phase 6 — video tools (category «ویدیو و صدا»)                  */
  /* ---------------------------------------------------------------- */
  {
    id: "video-compressor",
    slug: "video-compressor",
    title: "فشرده‌سازی ویدیو",
    description:
      "حجم ویدیو را برای اشتراک‌گذاری کاهش دهید؛ اندازهٔ تقریبی خروجی را انتخاب کنید و فایل را در مرورگر پردازش کنید.",
    steps: [
      "ویدیو را انتخاب کنید؛ پردازش فایل‌های بزرگ به حافظه و توان دستگاه بستگی دارد.",
      "با اسلایدر، حجم تقریبی خروجی را انتخاب کنید؛ هدف کوچک‌تر ممکن است کیفیت را کاهش دهد.",
      "پردازش را شروع کنید و پس از آماده‌شدن، حجم و کیفیت خروجی را بررسی و فایل را دانلود کنید.",
    ],
    category: "video",
    icon: Video,
    seoTitle: "فشرده‌سازی ویدیو آنلاین (کاهش حجم برای واتساپ)",
    seoDescription:
      "حجم تقریبی خروجی ویدئو را انتخاب کنید؛ خروجی MP4 با پردازش در مرورگر، بدون ارسال ویدیو به سرور.",
    keywords: ["فشرده سازی ویدیو", "کاهش حجم ویدیو", "compress video", "ویدیو برای واتساپ", "کم کردن حجم فیلم"],
    status: "live",
    popular: true,
    addedAt: "2025-11-15",
  },
  {
    id: "video-to-gif",
    slug: "video-to-gif",
    title: "تبدیل ویدیو به GIF",
    description:
      "بخشی از ویدیو را به GIF باکیفیت تبدیل کنید؛ با انتخاب عرض، نرخ فریم و بازهٔ زمانی.",
    steps: [
      "ویدیو را انتخاب کنید.",
      "عرض، نرخ فریم و بازهٔ زمانی (شروع و پایان به ثانیه) را مشخص کنید.",
      "پردازش را شروع کنید و GIF را دانلود کنید.",
    ],
    category: "video",
    icon: FileImage,
    seoTitle: "تبدیل ویدیو به GIF آنلاین",
    seoDescription:
      "از ویدیو یا فیلم، GIF باکیفیت بسازید (با پالت رنگ بهینه)؛ انتخاب زمان شروع و پایان، بدون آپلود فایل.",
    keywords: ["تبدیل ویدیو به GIF", "video to gif", "ساخت گیف از فیلم", "gif ساز"],
    status: "live",
    popular: false,
    addedAt: "2025-11-15",
  },
  {
    id: "video-to-audio",
    slug: "video-to-audio",
    title: "استخراج صدا از ویدیو (MP3)",
    description:
      "صدای ویدیو را جدا کنید و به‌صورت MP3 با کیفیت دلخواه ذخیره کنید.",
    steps: [
      "ویدیو را انتخاب کنید.",
      "کیفیت صدای خروجی (۱۹۲، ۱۲۸ یا ۶۴ کیلوبیت) را انتخاب کنید.",
      "پردازش را شروع کنید و فایل MP3 را دانلود کنید.",
    ],
    category: "video",
    icon: AudioLines,
    seoTitle: "استخراج صدا از ویدیو (تبدیل به MP3)",
    seoDescription:
      "صدای فیلم را جدا کنید و MP3 بگیرید؛ کیفیت قابل انتخاب و پردازش کاملاً در مرورگر بدون آپلود.",
    keywords: ["استخراج صدا از ویدیو", "ویدیو به صدا", "video to mp3", "تبدیل فیلم به موزیک"],
    status: "live",
    popular: false,
    addedAt: "2025-11-15",
  },
  {
    id: "video-trimmer",
    slug: "video-trimmer",
    title: "بریدن و کوتاه کردن ویدیو",
    description:
      "بازهٔ دلخواه از ویدیو را جدا کنید؛ خروجی MP4 با همان کیفیت، بدون نصب برنامه.",
    steps: [
      "ویدیو را انتخاب کنید.",
      "زمان شروع و پایان را به ثانیه وارد کنید (پایان خالی = تا آخر).",
      "پردازش را شروع کنید و کلیپ بریده‌شده را دانلود کنید.",
    ],
    category: "video",
    icon: Scissors,
    seoTitle: "بریدن و کوتاه کردن ویدیو آنلاین",
    seoDescription:
      "بخش دلخواه ویدیو را جدا کنید؛ برش دقیق با زمان شروع و پایان، خروجی MP4 و بدون آپلود.",
    keywords: ["بریدن ویدیو", "کوتاه کردن فیلم", "trim video", "cut video", "جدا کردن بخشی از ویدیو"],
    status: "live",
    popular: false,
    addedAt: "2025-11-15",
  },
  {
    id: "video-resizer",
    slug: "video-resizer",
    title: "تغییر رزولوشن ویدیو",
    description:
      "اندازهٔ ویدیو را تغییر دهید و نسبت تصویر را برای استوری، پست مربع یا افقی تنظیم کنید.",
    steps: [
      "ویدیو را انتخاب کنید.",
      "رزولوشن خروجی و نسبت تصویر را انتخاب کنید.",
      "پردازش را شروع کنید و ویدیوی تغییر‌اندازه‌شده را دانلود کنید.",
    ],
    category: "video",
    icon: Scaling,
    seoTitle: "تغییر رزولوشن ویدیو آنلاین",
    seoDescription:
      "رزولوشن ویدیو را به ۱۰۸۰p، ۷۲۰p، ۴۸۰p یا ۳۶۰p تغییر دهید و نسبت تصویر را برای استوری و پست تنظیم کنید.",
    keywords: ["تغییر رزولوشن ویدیو", "resize video", "تغییر سایز فیلم", "ویدیو استوری", "1080p"],
    status: "live",
    popular: false,
    addedAt: "2025-11-15",
  },


  /* ---------------------------------------------------------------- */
  /*  Phase 6 — بستهٔ B: مالی، سند، داده، متن، تصویر                 */
  /* ---------------------------------------------------------------- */
  {
    id: "salary-tax",
    slug: "salary-tax",
    title: "ماشین‌حساب حقوق و مالیات",
    description:
      "مالیات بر حقوق، بیمه و پرداختی خالص را با جدول پلکانی رسمی سال ۱۴۰۴ یا ۱۴۰۵ محاسبه کنید — سال را خودتان انتخاب می‌کنید.",
    steps: [
      "حقوق پایه و مزایای مشمول را وارد کنید.",
      "مزایای معاف (حق مسکن و بن) را مشخص کنید.",
      "مالیات ماهانه، بیمه و پرداختی خالص را ببینید.",
    ],
    category: "finance",
    icon: Wallet,
    seoTitle: "محاسبه مالیات بر حقوق و حقوق خالص ۱۴۰۴",
    seoDescription:
      "محاسبهٔ دقیق مالیات حقوق با پله‌های ۱۴۰۴، کسر بیمهٔ ۷٪ و محاسبهٔ پرداختی خالص؛ همراه با تفکیک پله‌های مالیاتی.",
    keywords: ["مالیات حقوق", "محاسبه حقوق خالص", "حقوق و دستمزد", "معافیت مالیاتی ۱۴۰۴", "salary tax"],
    status: "live",
    popular: true,
    addedAt: "2025-11-20",
  },
  {
    id: "image-crop",
    slug: "image-crop",
    title: "برش تصویر (Crop)",
    description:
      "عکس را با نسبت‌های آمادهٔ اینستاگرام، استوری و کاور یوتیوب برش بدهید.",
    steps: [
      "عکس را انتخاب یا رها کنید.",
      "نسبت برش (۱:۱، ۴:۵، ۹:۱۶…) را انتخاب کنید.",
      "برش را بزنید و تصویر را دانلود کنید.",
    ],
    category: "images",
    icon: Crop,
    seoTitle: "برش آنلاین عکس با نسبت اینستاگرام و استوری",
    seoDescription:
      "برش تصویر با نسبت‌های آمادهٔ شبکه‌های اجتماعی (پست، استوری، کاور) بدون افت کیفیت؛ کاملاً در مرورگر.",
    keywords: ["برش عکس", "crop image", "برش تصویر اینستاگرام", "سایز استوری", "کاور یوتیوب"],
    status: "live",
    popular: false,
    addedAt: "2025-11-20",
  },
  {
    id: "favicon-generator",
    slug: "favicon-generator",
    title: "ساخت favicon از عکس",
    description:
      "از یک عکس یا لوگو، پنج سایز استاندارد favicon را در یک فایل ZIP بگیرید.",
    steps: [
      "عکس یا لوگو را انتخاب کنید.",
      "پس‌زمینه و گردی گوشه‌ها را تنظیم کنید.",
      "بستهٔ ZIP را بسازید و دانلود کنید.",
    ],
    category: "images",
    icon: Package,
    seoTitle: "ساخت favicon آنلاین از عکس (ZIP)",
    seoDescription:
      "تولید favicon در سایزهای ۱۶، ۳۲، ۱۸۰، ۱۹۲ و ۵۱۲ پیکسل همراه با site.webmanifest و کد HTML آماده.",
    keywords: ["favicon", "فاوآیکون", "ساخت آیکون سایت", "apple touch icon", "manifest"],
    status: "live",
    popular: false,
    addedAt: "2025-11-20",
  },
  {
    id: "pdf-reorder",
    slug: "pdf-reorder",
    title: "مرتب‌سازی صفحات PDF",
    description:
      "ترتیب صفحه‌های PDF را با پیش‌نمایش تصویری تغییر دهید و فایل جدید بگیرید.",
    steps: [
      "فایل PDF را انتخاب کنید تا پیش‌نمایش صفحه‌ها ساخته شود.",
      "با کلیدهای جابه‌جایی، ترتیب را درست کنید (یا برعکس/تصادفی).",
      "فایل PDF با ترتیب جدید را دانلود کنید.",
    ],
    category: "files",
    icon: Layers,
    seoTitle: "مرتب‌سازی و جابه‌جایی صفحات PDF آنلاین",
    seoDescription:
      "ترتیب صفحات PDF را با پیش‌نمایش تغییر دهید؛ بدون آپلود فایل و بدون افت کیفیت متن.",
    keywords: ["مرتب سازی PDF", "جابه جایی صفحات PDF", "reorder pdf", "ترتیب صفحات"],
    status: "live",
    popular: false,
    addedAt: "2025-11-20",
  },
  {
    id: "pdf-watermark",
    slug: "pdf-watermark",
    title: "شمارهٔ صفحه و واترمارک PDF",
    description:
      "به همهٔ صفحه‌های PDF شمارهٔ صفحه و واترمارک متنی اضافه کنید.",
    steps: [
      "فایل PDF را انتخاب کنید.",
      "شمارهٔ صفحه و/یا متن واترمارک را تنظیم کنید.",
      "فایل جدید را دانلود کنید.",
    ],
    category: "files",
    icon: Stamp,
    seoTitle: "افزودن شماره صفحه و واترمارک به PDF",
    seoDescription:
      "درج شمارهٔ صفحه با ارقام فارسی و واترمارک متنی روی همهٔ صفحه‌های PDF، بدون آپلود فایل.",
    keywords: ["شماره صفحه PDF", "واترمارک PDF", "page number pdf", "watermark pdf"],
    status: "live",
    popular: false,
    addedAt: "2025-11-20",
  },
  {
    id: "doc-invoice",
    slug: "doc-invoice",
    title: "سازندهٔ فاکتور و رسید",
    description:
      "فاکتور فارسی با ردیف‌های کالا، جمع خودکار، تخفیف و مالیات؛ خروجی PDF با فونت فارسی.",
    steps: [
      "شماره و تاریخ فاکتور، فروشنده و خریدار را وارد کنید.",
      "ردیف‌های کالا را اضافه کنید؛ جمع و مالیات خودکار حساب می‌شود.",
      "PDF را دانلود کنید.",
    ],
    category: "files",
    icon: Receipt,
    seoTitle: "ساخت فاکتور فارسی آنلاین با PDF",
    seoDescription:
      "فاکتور فروش فارسی بسازید: ردیف کالا، جمع خودکار، تخفیف و مالیات بر ارزش افزوده، خروجی PDF با فونت فارسی. بدون ثبت‌نام.",
    keywords: ["ساخت فاکتور", "pdf فارسی", "ساخت pdf رایگان", "فرم فارسی pdf"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "doc-resume",
    slug: "doc-resume",
    title: "سازندهٔ رزومه",
    description:
      "رزومهٔ فارسی تمیز و یک‌صفحه‌ای با خروجی PDF؛ بدون ثبت‌نام و بدون واترمارک.",
    steps: [
      "نام، عنوان شغلی و راه‌های تماس را وارد کنید.",
      "خلاصه، سوابق، تحصیلات و مهارت‌ها را بنویسید.",
      "PDF را دانلود کنید.",
    ],
    category: "files",
    icon: UserRound,
    seoTitle: "ساخت رزومه فارسی با خروجی PDF",
    seoDescription:
      "رزومهٔ فارسی حرفه‌ای بسازید و PDF بگیرید: خلاصهٔ حرفه‌ای، سوابق شغلی، تحصیلات و مهارت‌ها — رایگان، بدون ثبت‌نام و بدون واترمارک.",
    keywords: ["ساخت رزومه", "pdf فارسی", "ساخت pdf رایگان", "فرم فارسی pdf"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "doc-letter",
    slug: "doc-letter",
    title: "سازندهٔ نامهٔ اداری",
    description:
      "نامهٔ اداری با قالب استاندارد فارسی (شماره، تاریخ، موضوع، پیوست و امضا) و خروجی PDF.",
    steps: [
      "فرستنده، گیرنده و موضوع را بنویسید.",
      "متن نامه را وارد کنید.",
      "PDF را دانلود کنید.",
    ],
    category: "files",
    icon: FilePen,
    seoTitle: "ساخت نامه اداری فارسی با PDF",
    seoDescription:
      "نامهٔ اداری فارسی با شماره، تاریخ، موضوع، پیوست و محل امضا بسازید و PDF بگیرید — قالب استاندارد و رایگان.",
    keywords: ["نامه اداری", "pdf فارسی", "ساخت pdf رایگان", "فرم فارسی pdf"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "doc-lease",
    slug: "doc-lease",
    title: "سازندهٔ قرارداد اجاره",
    description:
      "قرارداد اجارهٔ مسکونی با طرفین، ملک، مدت، ودیعه و اجارهٔ ماهانه — قابل چاپ و PDF.",
    steps: [
      "اطلاعات موجر، مستأجر و ملک را وارد کنید.",
      "مدت، ودیعه و اجارهٔ ماهانه را بنویسید.",
      "PDF را دانلود و چاپ کنید.",
    ],
    category: "files",
    icon: FileSignature,
    seoTitle: "ساخت قرارداد اجاره مسکونی فارسی",
    seoDescription:
      "قرارداد اجارهٔ مسکونی فارسی بسازید: طرفین، نشانی ملک، مدت، ودیعه و اجارهٔ ماهانه، بندهای پایه و محل امضا. خروجی PDF رایگان.",
    keywords: ["قرارداد اجاره", "pdf فارسی", "ساخت pdf رایگان", "فرم فارسی pdf"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "doc-experience",
    slug: "doc-experience",
    title: "سازندهٔ گواهی سابقهٔ کار",
    description:
      "گواهی اشتغال با نام، کد ملی، سمت و مدت همکاری برای ارائه به سفارت، بانک یا دانشگاه.",
    steps: [
      "نام شرکت و اطلاعات کارمند را وارد کنید.",
      "سمت و بازهٔ اشتغال را بنویسید.",
      "PDF گواهی را دانلود کنید.",
    ],
    category: "files",
    icon: FileCheck,
    seoTitle: "ساخت گواهی سابقه کار با PDF",
    seoDescription:
      "گواهی سابقهٔ کار فارسی بسازید: نام و کد ملی، سمت، مدت اشتغال و محل مهر و امضا. مناسب ارائه به سفارت و بانک — خروجی PDF.",
    keywords: ["گواهی سابقه کار", "pdf فارسی", "ساخت pdf رایگان", "فرم فارسی pdf"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "address-transliterator",
    slug: "address-transliterator",
    title: "نشانی فارسی به لاتین",
    description:
      "نشانی فارسی را به حروف لاتین برگردانید؛ مناسب پر کردن فرم‌های خارجی و بسته‌های پستی بین‌المللی.",
    steps: [
      "نشانی فارسی را وارد کنید.",
      "نشانی لاتین و برگردان کلمه‌به‌کلمه را ببینید.",
      "با دکمهٔ کپی، نشانی لاتین را بردارید.",
    ],
    category: "text",
    icon: Languages,
    seoTitle: "تبدیل نشانی فارسی به انگلیسی (آوانگاری)",
    seoDescription:
      "آدرس فارسی را به حروف لاتین تبدیل کنید: خیابان، کوچه، پلاک و نام شهرها با واژه‌نامهٔ دقیق و برگردان کلمه‌به‌کلمه — رایگان و بدون ثبت‌نام.",
    keywords: ["آدرس فارسی به انگلیسی", "تبدیل آدرس به لاتین", "نشانی انگلیسی", "persian address transliteration", "آوانگاری فارسی", "ادرس به انگلیسی"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "pdf-encrypt",
    slug: "pdf-encrypt",
    title: "رمزگذاری PDF",
    description:
      "برای فایل PDF رمز بگذارید تا فقط با رمز باز شود؛ رمزگذاری استاندارد PDF، همه در مرورگر خودتان.",
    steps: [
      "فایل PDF را انتخاب کنید.",
      "رمز دلخواه را وارد کنید و دکمهٔ رمزگذاری را بزنید.",
      "فایل رمزدار را دانلود کنید؛ رمز را جایی امن نگه دارید.",
    ],
    category: "files",
    icon: Lock,
    seoTitle: "رمزگذاری PDF آنلاین بدون آپلود فایل",
    seoDescription:
      "برای PDF خود رمز بگذارید تا بدون رمز باز نشود. رمزگذاری استاندارد PDF در مرورگر انجام می‌شود و فایل شما به هیچ سروری فرستاده نمی‌شود.",
    keywords: ["رمزگذاری pdf", "قفل کردن pdf", "پسورد گذاشتن روی pdf", "pdf password", "محافظت از pdf", "رمز عبور پی دی اف"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "pdf-decrypt",
    slug: "pdf-decrypt",
    title: "حذف رمز PDF",
    description:
      "اگر رمز فایل PDF را می‌دانید، با آن رمز را بردارید و نسخهٔ بدون رمز بسازید.",
    steps: [
      "فایل PDF رمزدار را انتخاب کنید.",
      "رمز فعلی را وارد کنید.",
      "نسخهٔ بدون رمز را دانلود کنید.",
    ],
    category: "files",
    icon: LockOpen,
    seoTitle: "حذف رمز PDF با دانستن پسورد",
    seoDescription:
      "رمز PDF خود را بردارید و نسخهٔ بدون رمز بسازید. رمز را باید بدانید؛ این ابزار رمز را نمی‌شکند و فایل را جایی آپلود نمی‌کند.",
    keywords: ["حذف رمز pdf", "برداشتن پسورد pdf", "باز کردن قفل pdf", "remove pdf password", "pdf بدون رمز"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "pdf-text-extractor",
    slug: "pdf-text-extractor",
    title: "استخراج متن از PDF",
    description:
      "متن PDF را بیرون بکشید و به‌صورت متن ساده کپی یا دانلود کنید؛ با پشتیبانی از فارسی و بازسازی ترتیب راست‌به‌چپ.",
    steps: [
      "فایل PDF را انتخاب کنید.",
      "متن هر صفحه را ببینید (و در صورت به‌هم‌ریختگی، تیک ترتیب راست‌به‌چپ را بردارید).",
      "متن را کپی کنید یا همهٔ آن را به‌صورت TXT دانلود کنید.",
    ],
    category: "files",
    icon: FileOutput,
    seoTitle: "استخراج متن از PDF فارسی و انگلیسی",
    seoDescription:
      "متن را از فایل PDF بیرون بکشید و به TXT تبدیل کنید. مخصوص فارسی: ترتیب راست‌به‌چپ بازسازی می‌شود. بدون آپلود، در مرورگر خودتان.",
    keywords: ["استخراج متن از pdf", "متن pdf به word", "تبدیل pdf به متن", "pdf to text", "کپی متن از pdf", "خروجی متن پی دی اف"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "timestamp-converter",
    slug: "timestamp-converter",
    title: "تبدیل Timestamp به تاریخ",
    description:
      "Timestamp یونیکس را به تاریخ شمسی و میلادی تبدیل کنید و برعکس.",
    steps: [
      "Timestamp را وارد کنید (ثانیه یا میلی‌ثانیه).",
      "تاریخ شمسی، میلادی و ISO را ببینید.",
      "برای مسیر برعکس، یک تاریخ انتخاب کنید.",
    ],
    category: "dev",
    icon: CalendarClock,
    seoTitle: "تبدیل Timestamp به تاریخ شمسی و میلادی",
    seoDescription:
      "تبدیل Unix timestamp به تاریخ شمسی و میلادی و برعکس؛ با تشخیص خودکار ثانیه و میلی‌ثانیه.",
    keywords: ["timestamp", "یونیکس تایم", "تبدیل timestamp به تاریخ", "unix time", "epoch converter"],
    status: "live",
    popular: false,
    addedAt: "2025-11-20",
  },
  {
    id: "csv-json",
    slug: "csv-json",
    title: "تبدیل CSV و JSON",
    description: "داده‌های CSV را به JSON و JSON را به CSV تبدیل کنید؛ دوطرفه و دقیق.",
    steps: [
      "حالت تبدیل را انتخاب کنید (CSV→JSON یا JSON→CSV).",
      "داده را در کادر بچسبانید.",
      "خروجی را کپی کنید.",
    ],
    category: "dev",
    icon: Braces,
    seoTitle: "تبدیل CSV به JSON و JSON به CSV آنلاین",
    seoDescription:
      "تبدیل دقیق CSV به JSON و برعکس، با پشتیبانی از فیلدهای داخل گیومه، جداکنندهٔ خودکار و تشخیص نوع داده.",
    keywords: ["CSV به JSON", "JSON به CSV", "csv to json", "json to csv", "تبدیل اکسل به جیسون"],
    status: "live",
    popular: false,
    addedAt: "2025-11-20",
  },
  {
    id: "color-picker",
    slug: "color-picker",
    title: "انتخاب رنگ و کد رنگ",
    description: "رنگ را انتخاب کنید و کد HEX، RGB و HSL آن را در لحظه بگیرید.",
    steps: [
      "از انتخابگر رنگ یا کد HEX استفاده کنید.",
      "با اسلایدرها روشنایی و اشباع را تنظیم کنید.",
      "کد HEX، RGB یا HSL را کپی کنید.",
    ],
    category: "dev",
    icon: Palette,
    seoTitle: "انتخاب رنگ آنلاین و تبدیل HEX، RGB، HSL",
    seoDescription:
      "کد رنگ را انتخاب و به HEX، RGB و HSL تبدیل کنید؛ با پیش‌نمایش و رنگ‌های آماده.",
    keywords: ["انتخاب رنگ", "کد رنگ", "color picker", "HEX به RGB", "تبدیل رنگ"],
    status: "live",
    popular: false,
    addedAt: "2025-11-20",
  },
  {
    id: "find-replace",
    slug: "find-replace",
    title: "پیدا و جایگزین چندگانه",
    description:
      "در یک متن، چندین عبارت را همزمان پیدا و جایگزین کنید؛ به ترتیب قواعد.",
    steps: [
      "متن را در کادر اصلی بچسبانید.",
      "قواعد «پیدا → جایگزین» را اضافه کنید.",
      "خروجی ویرایش‌شده را کپی کنید.",
    ],
    category: "text",
    icon: Replace,
    seoTitle: "پیدا و جایگزین چندگانه متن آنلاین",
    seoDescription:
      "چندین جایگزینی را در یک متن، همزمان و به ترتیب انجام دهید؛ با گزینهٔ بی‌توجه به بزرگی/کوچکی حروف.",
    keywords: ["پیدا و جایگزین", "replace all", "جایگزینی گروهی", "جستجو و جایگزینی"],
    status: "live",
    popular: false,
    addedAt: "2025-11-20",
  },
  {
    id: "password-generator",
    slug: "password-generator",
    title: "تولید رمز عبور قوی",
    description:
      "رمز عبور تصادفی و قوی بسازید؛ با تعیین طول، نوع کاراکترها و سنجش قدرت.",
    steps: [
      "طول رمز و نوع کاراکترها را انتخاب کنید.",
      "تعداد رمز را مشخص کنید.",
      "روی رمز بزنید تا کپی شود.",
    ],
    category: "dev",
    icon: KeyRound,
    seoTitle: "تولید رمز عبور قوی و تصادفی",
    seoDescription:
      "ساخت رمز عبور تصادفی با crypto.getRandomValues در مرورگر؛ با سنجش آنتروپی و حذف حروف شبیه به هم.",
    keywords: ["تولید رمز عبور", "پسورد ساز", "password generator", "رمز قوی", "رمز تصادفی"],
    status: "live",
    popular: true,
    addedAt: "2025-11-20",
  },
  {
    id: "persian-lorem",
    slug: "persian-lorem",
    title: "متن ساختگی فارسی (لورم ایپسوم)",
    description:
      "متن ساختگی فارسی برای پر کردن قالب و طراحی؛ با تعداد پاراگراف و جملهٔ دلخواه.",
    steps: [
      "تعداد پاراگراف و جمله را انتخاب کنید.",
      "اگر متن جدید می‌خواهید «متن جدید» را بزنید.",
      "متن را کپی و در طرح خود استفاده کنید.",
    ],
    category: "text",
    icon: Type,
    seoTitle: "متن لورم ایپسوم فارسی (متن ساختگی برای طراحی)",
    seoDescription:
      "تولید متن ساختگی فارسی برای طراحی، تست طول متن و پر کردن قالب؛ قابل کپی با یک کلیک.",
    keywords: ["لورم ایپسوم فارسی", "متن ساختگی", "lorem ipsum persian", "متن تستی", "متن بدل"],
    status: "live",
    popular: false,
    addedAt: "2025-11-20",
  },

  {
    id: "national-id-validator",
    slug: "national-id-validator",
    title: "اعتبارسنجی کد ملی",
    description:
      "کد ملی را با الگوریتم رسمی mod-11 بررسی کنید؛ رقم کنترل و خطاهای تایپی همان لحظه مشخص میشود.",
    steps: [
      "کد ملی ۱۰ رقمی را وارد کنید (ارقام فارسی هم پذیرفته میشود).",
      "نتیجهٔ معتبر/نامعتبر و دلیل آن را ببینید.",
      "اگر نامعتبر بود، رقم اشتباه معمولاً در رقم کنترل آخر است.",
    ],
    category: "numbers",
    icon: IdCard,
    seoTitle: "اعتبارسنجی کد ملی آنلاین و رایگان",
    seoDescription:
      "کد ملی را با الگوریتم رسمی mod-11 بررسی کنید؛ رقم کنترل و خطاهای تایپی همان لحظه مشخص میشود.",
    keywords: ["کد ملی","اعتبارسنجی کد ملی","بررسی کد ملی","national id","کد ملی معتبر"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "seo-analyzer",
    slug: "seo-analyzer",
    title: "بررسی سئوی صفحه",
    description:
      "سورس صفحه را بچسبانید تا عنوان، متا، تیترها، چگالی کلیدواژه و ایرادهای سئو با امتیاز بررسی شود.",
    steps: [
      "سورس HTML صفحه را (Ctrl+U) کپی و بچسبانید.",
      "کلیدواژهٔ هدف را وارد کنید تا تراکم و جایگاهش بررسی شود.",
      "فهرست ایرادها را همراه پیشنهاد اصلاح ببینید.",
    ],
    category: "seo",
    icon: SearchCheck,
    seoTitle: "بررسی سئوی صفحه آنلاین و رایگان",
    seoDescription:
      "سورس صفحه را بچسبانید تا عنوان، متا، تیترها، چگالی کلیدواژه و ایرادهای سئو با امتیاز بررسی شود.",
    keywords: ["بررسی سئو","آنالیز سئو","seo analyzer","سئوی صفحه","چگالی کلیدواژه"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "meta-tag-generator",
    slug: "meta-tag-generator",
    title: "سازندهٔ تگ عنوان و متا",
    description:
      "تگهای title، description، canonical و Open Graph را با شمارندهٔ طول بسازید و کپی کنید.",
    steps: [
      "عنوان و توضیح را وارد کنید.",
      "شمارندهٔ طول هر فیلد را کنترل کنید.",
      "کد کامل head را کپی و در صفحه بگذارید.",
    ],
    category: "seo",
    icon: Tags,
    seoTitle: "سازندهٔ تگ عنوان و متا آنلاین و رایگان",
    seoDescription:
      "تگهای title، description، canonical و Open Graph را با شمارندهٔ طول بسازید و کپی کنید.",
    keywords: ["متا تگ","سازنده متا","title tag","meta description","open graph"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "serp-preview",
    slug: "serp-preview",
    title: "پیشنمایش نتیجهٔ گوگل",
    description:
      "ببینید عنوان و توضیح صفحه در گوگل دسکتاپ و موبایل چطور دیده میشود، با عرض پیکسلی تخمینی.",
    steps: [
      "عنوان، توضیح و آدرس را وارد کنید.",
      "بین دسکتاپ و موبایل جابهجا شوید.",
      "خط قرمز یعنی متن در نتایج بریده میشود.",
    ],
    category: "seo",
    icon: MonitorSmartphone,
    seoTitle: "پیشنمایش نتیجهٔ گوگل آنلاین و رایگان",
    seoDescription:
      "ببینید عنوان و توضیح صفحه در گوگل دسکتاپ و موبایل چطور دیده میشود، با عرض پیکسلی تخمینی.",
    keywords: ["پیش نمایش گوگل","serp preview","نمایش در گوگل","عنوان در نتایج گوگل"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "social-tag-checker",
    slug: "social-tag-checker",
    title: "بررسی تگهای اشتراکگذاری",
    description:
      "بررسی کنید کدام تگهای Open Graph و Twitter Card در صفحه هست و کارت لینک در تلگرام و واتساپ چطور میشود.",
    steps: [
      "سورس صفحه را بچسبانید.",
      "تگهای موجود و غایب را ببینید.",
      "تگهای og:image و og:title را اول از همه اضافه کنید.",
    ],
    category: "seo",
    icon: Share2,
    seoTitle: "بررسی تگهای اشتراکگذاری آنلاین و رایگان",
    seoDescription:
      "بررسی کنید کدام تگهای Open Graph و Twitter Card در صفحه هست و کارت لینک در تلگرام و واتساپ چطور میشود.",
    keywords: ["open graph","og tag","تگ اشتراک گذاری","twitter card"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "heading-analyzer",
    slug: "heading-analyzer",
    title: "تحلیل ساختار تیترها",
    description:
      "تیترهای H1 تا H6 صفحه را استخراج کنید و پرش سطح و تعداد H1 را بررسی کنید.",
    steps: [
      "کد HTML را بچسبانید.",
      "دکمهٔ تحلیل را بزنید.",
      "ساختار درختی تیترها و هشدارها را ببینید.",
    ],
    category: "seo",
    icon: Heading1,
    seoTitle: "تحلیل ساختار تیترها آنلاین و رایگان",
    seoDescription:
      "تیترهای H1 تا H6 صفحه را استخراج کنید و پرش سطح و تعداد H1 را بررسی کنید.",
    keywords: ["تیتر","h1","ساختار هدینگ","heading analyzer"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "robots-txt-checker",
    slug: "robots-txt-checker",
    title: "بررسی robots.txt",
    description:
      "فایل robots.txt را بررسی کنید: Disallow کامل، نبود User-agent و نبود Sitemap را پیدا میکند.",
    steps: [
      "محتوای robots.txt را بچسبانید.",
      "خطاها و هشدارها را ببینید.",
      "قبل از انتشار، Disallow: / را حتماً چک کنید.",
    ],
    category: "seo",
    icon: Bot,
    seoTitle: "بررسی robots.txt آنلاین و رایگان",
    seoDescription:
      "فایل robots.txt را بررسی کنید: Disallow کامل، نبود User-agent و نبود Sitemap را پیدا میکند.",
    keywords: ["robots.txt","بررسی robots","خزش گوگل","سایت مپ"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "sitemap-checker",
    slug: "sitemap-checker",
    title: "بررسی نقشهٔ سایت",
    description:
      "محتوای sitemap.xml را بررسی کنید: نوع فایل، تعداد آدرسها و اینکه واقعاً XML معتبر است یا نه.",
    steps: [
      "محتوای sitemap.xml را بچسبانید.",
      "نوع (urlset یا sitemapindex) و تعداد آدرس را ببینید.",
      "اگر malformed بود، یعنی آدرس اشتباه است.",
    ],
    category: "seo",
    icon: Map,
    seoTitle: "بررسی نقشهٔ سایت آنلاین و رایگان",
    seoDescription:
      "محتوای sitemap.xml را بررسی کنید: نوع فایل، تعداد آدرسها و اینکه واقعاً XML معتبر است یا نه.",
    keywords: ["sitemap","نقشه سایت","sitemap.xml","بررسی سایت مپ"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "schema-generator",
    slug: "schema-generator",
    title: "سازندهٔ Schema (JSON-LD)",
    description:
      "کد JSON-LD برای FAQPage، HowTo و LocalBusiness بسازید و کپی کنید.",
    steps: [
      "نوع اسکیما را انتخاب کنید.",
      "پرسشها یا گامها را پر کنید.",
      "کد JSON-LD آماده را کپی و داخل صفحه بگذارید.",
    ],
    category: "seo",
    icon: Braces,
    seoTitle: "سازندهٔ Schema (JSON-LD) آنلاین و رایگان",
    seoDescription:
      "کد JSON-LD برای FAQPage، HowTo و LocalBusiness بسازید و کپی کنید.",
    keywords: ["schema","json-ld","اسکیما","faq schema","howto schema"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "keyword-density-checker",
    slug: "keyword-density-checker",
    title: "چگالی کلیدواژه",
    description:
      "تعداد و درصد تکرار کلیدواژه در متن را ببینید تا از keyword stuffing دور بمانید.",
    steps: [
      "متن را بچسبانید.",
      "کلیدواژه را وارد کنید.",
      "چگالی بالای ۳٪ معمولاً زیاد است.",
    ],
    category: "seo",
    icon: Percent,
    seoTitle: "چگالی کلیدواژه آنلاین و رایگان",
    seoDescription:
      "تعداد و درصد تکرار کلیدواژه در متن را ببینید تا از keyword stuffing دور بمانید.",
    keywords: ["چگالی کلیدواژه","keyword density","تراکم کلمه کلیدی","keyword stuffing"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "canonical-checker",
    slug: "canonical-checker",
    title: "بررسی آدرس canonical",
    description:
      "تگ canonical صفحه را بررسی کنید: وجود، تطابق با آدرس واقعی و مشکل تکرار محتوا.",
    steps: [
      "آدرس واقعی صفحه را وارد کنید.",
      "مقدار تگ canonical را وارد کنید.",
      "اگر به صفحهٔ دیگری اشاره کند، همان صفحه ایندکس میشود.",
    ],
    category: "seo",
    icon: Link2,
    seoTitle: "بررسی آدرس canonical آنلاین و رایگان",
    seoDescription:
      "تگ canonical صفحه را بررسی کنید: وجود، تطابق با آدرس واقعی و مشکل تکرار محتوا.",
    keywords: ["canonical","تگ canonical","محتوای تکراری","canonical url"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "image-seo-checker",
    slug: "image-seo-checker",
    title: "بررسی سئوی تصاویر",
    description:
      "متن جایگزین (alt)، نام فایل و اندازهٔ تصاویر صفحه را از نظر سئو بررسی کنید.",
    steps: [
      "کد HTML تصاویر صفحه را بچسبانید.",
      "تصاویر بدون alt یا با alt بیارزش را ببینید.",
      "نام فایلهای بیریط را اصلاح کنید.",
    ],
    category: "seo",
    icon: Image,
    seoTitle: "بررسی سئوی تصاویر آنلاین و رایگان",
    seoDescription:
      "متن جایگزین (alt)، نام فایل و اندازهٔ تصاویر صفحه را از نظر سئو بررسی کنید.",
    keywords: ["سئوی تصاویر","alt تصویر","image seo","متن جایگزین"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
  },
  {
    id: "url-slug-analyzer",
    slug: "url-slug-analyzer",
    title: "تحلیل اسلاگ آدرس",
    description:
      "اسلاگ آدرس را از نظر طول، کاراکترهای مجاز، خط تیره و خوانایی برای فارسی بررسی کنید.",
    steps: [
      "آدرس یا اسلاگ را وارد کنید.",
      "نسخهٔ پیشنهادی ASCII را ببینید.",
      "طول و کاراکترهای غیرمجاز را اصلاح کنید.",
    ],
    category: "seo",
    icon: Link,
    seoTitle: "تحلیل اسلاگ آدرس آنلاین و رایگان",
    seoDescription:
      "اسلاگ آدرس را از نظر طول، کاراکترهای مجاز، خط تیره و خوانایی برای فارسی بررسی کنید.",
    keywords: ["اسلاگ","slug","آدرس صفحه","url"],
    status: "live",
    popular: false,
    addedAt: "2026-11-14",
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
