import type { LucideIcon } from "lucide-react";
import {
  CalendarSync,
  Clapperboard,
  FileArchive,
  Percent,
  QrCode,
  Type,
  Video,
  Wallet,
} from "lucide-react";

/**
 * Real questions people type into Google, answered by one click.
 *
 * Deliberately *not* a FAQ accordion: each row is a searchable sentence paired
 * with the tool that resolves it, which is how the query actually gets
 * satisfied. Wording mirrors Persian search phrasing (…چقدر است؟، چطور…).
 *
 * `slug` is what the integrity test checks against tools.ts — keep href derived
 * from it so a renamed tool can never leave a dead link here.
 */
export interface QuestionLink {
  /** The question, in the user's own words. */
  question: string;
  /** Tool slug that answers the question. */
  slug: string;
  /** Short tool name shown as the action. */
  toolLabel: string;
  /** One-line clarifier, hidden on narrow screens. */
  hint: string;
  icon: LucideIcon;
}

export const popularQuestions: QuestionLink[] = [
  {
    question: "حقوق ۱۴۰۴ چقدر می‌شود؟",
    slug: "salary-tax",
    toolLabel: "ماشین‌حساب حقوق",
    hint: "بیمه، مالیات و خالص دریافتی",
    icon: Wallet,
  },
  {
    question: "چطور حجم عکسم را کم کنم؟",
    slug: "image-compressor",
    toolLabel: "فشرده‌ساز تصویر",
    hint: "بدون افت کیفیت، در مرورگر",
    icon: FileArchive,
  },
  {
    question: "چطور PDF را برای آپلود کوچک کنم؟",
    slug: "pdf-compressor",
    toolLabel: "فشرده‌ساز PDF",
    hint: "سه سطح فشرده‌سازی",
    icon: FileArchive,
  },
  {
    question: "ویدیوی بزرگ را چطور برای واتساپ بفرستم؟",
    slug: "video-compressor",
    toolLabel: "فشرده‌ساز ویدیو",
    hint: "تا ۲ گیگابایت، بدون آپلود",
    icon: Video,
  },
  {
    question: "چند کلمه است؟",
    slug: "word-counter",
    toolLabel: "شمارش کلمات",
    hint: "شمارش کلمات و زمان مطالعه",
    icon: Type,
  },
  {
    question: "تاریخ شمسی به میلادی چطور تبدیل می‌شود؟",
    slug: "date-converter",
    toolLabel: "مبدل تاریخ",
    hint: "شمسی ⇄ میلادی ⇄ قمری",
    icon: CalendarSync,
  },
  {
    question: "چطور ویدیو را به GIF تبدیل کنم؟",
    slug: "video-to-gif",
    toolLabel: "سازندهٔ GIF",
    hint: "با پالت رنگی و بدون آپلود",
    icon: Clapperboard,
  },
  {
    question: "چطور درصد و تخفیف را حساب کنم؟",
    slug: "percentage-calculator",
    toolLabel: "محاسبهٔ درصد",
    hint: "درصد، تغییر و تخفیف",
    icon: Percent,
  },
  {
    question: "لینک را چطور به QR تبدیل کنم؟",
    slug: "qr-code-generator",
    toolLabel: "سازندهٔ QR",
    hint: "تصویر ثابت، همیشه قابل اسکن",
    icon: QrCode,
  },
];

/** Href is always derived, so the link can't drift from the slug. */
export function questionHref(item: QuestionLink): string {
  return `/tools/${item.slug}`;
}
