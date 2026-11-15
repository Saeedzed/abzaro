import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  CalendarDays,
  Crop,
  FileDown,
  Image as ImageIcon,
  Percent,
  Scissors,
  Type,
  Video,
} from "lucide-react";

/**
 * "Intent-first" entry points for the homepage.
 *
 * People rarely arrive looking for a tool *name* ("HTML entity decoder") — they
 * arrive with a job to do ("my salary", "make this PDF smaller"). Each item below
 * is a plain-language task that lands directly on the matching tool.
 *
 * Keep this list short (6–8) and ordered by real search intent, not by category.
 */
export interface Intent {
  id: string;
  /** The task in the user's voice, without the leading «می‌خواهم». */
  label: string;
  /** Full do-it action, used in the mobile grid label under the icon. */
  shortLabel: string;
  href: string;
  icon: LucideIcon;
}

export const intents: Intent[] = [
  {
    id: "salary",
    label: "حقوقم را حساب کنم",
    shortLabel: "محاسبهٔ حقوق",
    href: "/tools/salary-tax",
    icon: Briefcase,
  },
  {
    id: "pdf-shrink",
    label: "PDF را کم‌حجم کنم",
    shortLabel: "کم‌حجم کردن PDF",
    href: "/tools/pdf-compressor",
    icon: FileDown,
  },
  {
    id: "video-compress",
    label: "ویدیو را برای واتساپ کوچک کنم",
    shortLabel: "فشرده‌سازی ویدیو",
    href: "/tools/video-compressor",
    icon: Video,
  },
  {
    id: "image-crop",
    label: "عکس را برش بزنم",
    shortLabel: "برش عکس",
    href: "/tools/image-crop",
    icon: Crop,
  },
  {
    id: "date",
    label: "تاریخ را تبدیل کنم",
    shortLabel: "تبدیل تاریخ",
    href: "/tools/date-converter",
    icon: CalendarDays,
  },
  {
    id: "word-count",
    label: "کلمات متن را بشمارم",
    shortLabel: "شمارش کلمات",
    href: "/tools/word-counter",
    icon: Type,
  },
  {
    id: "image-shrink",
    label: "حجم عکس را کم کنم",
    shortLabel: "فشرده‌سازی عکس",
    href: "/tools/image-compressor",
    icon: ImageIcon,
  },
  {
    id: "discount",
    label: "درصد و تخفیف را حساب کنم",
    shortLabel: "درصد و تخفیف",
    href: "/tools/percentage-calculator",
    icon: Percent,
  },
  {
    id: "video-trim",
    label: "ویدیو را ببرم",
    shortLabel: "بریدن ویدیو",
    href: "/tools/video-trimmer",
    icon: Scissors,
  },
];

/** The six shown in the hero on desktop. */
export const heroIntents = intents.slice(0, 6);

/**
 * Typed-out prompt for the hero copy: «می‌خواهم <چیزی>».
 * Kept as a helper so the copy stays grammatical in Persian for every intent.
 */
export function intentPrompt(intent: Intent): string {
  return `می‌خواهم ${intent.label}`;
}
