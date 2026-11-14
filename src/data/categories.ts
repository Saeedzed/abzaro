import {
  Calculator,
  Clapperboard,
  Code2,
  FilePen,
  FileText,
  Image as ImageIcon,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Tool categories. The `slug` here is the single source of truth referenced
 * by tools (`tool.category`) and by the /categories/[slug] route.
 */
export const categories: Category[] = [
  {
    slug: "text",
    title: "متن و ویرایش",
    description:
      "ابزارهای شمارش و ویرایش متن فارسی؛ از شمارش کلمات و کاراکترها تا پاک‌سازی و قالب‌بندی متن.",
    icon: FileText,
  },
  {
    slug: "numbers",
    title: "اعداد و محاسبات",
    description:
      "محاسبات روزمره، تبدیل اعداد به فارسی و درصد؛ سریع، دقیق و بدون نیاز به ماشین‌حساب.",
    icon: Calculator,
  },
  {
    slug: "images",
    title: "تصاویر",
    description:
      "تغییر اندازه، فشرده‌سازی و تبدیل قالب تصاویر؛ همه پردازش‌ها در مرورگر شما انجام می‌شود و فایلتان جایی آپلود نمی‌شود.",
    icon: ImageIcon,
  },
  {
    slug: "files",
    title: "PDF و سند",
    description:
      "تبدیل عکس به PDF، فشرده‌سازی، ادغام، چرخش، حذف و مرتب‌سازی صفحه‌ها، شمارهٔ صفحه و واترمارک، و تبدیل PDF به تصویر — بدون آپلود فایل.",
    icon: FilePen,
  },
  {
    slug: "finance",
    title: "مالی و حقوق",
    description:
      "محاسبهٔ اقساط وام، سود سپرده، تخفیف، حقوق و مالیات بر درآمد، عیدی و سنوات — با جدول‌های رسمی سال ۱۴۰۴.",
    icon: Wallet,
  },
  {
    slug: "video",
    title: "ویدیو و صدا",
    description:
      "فشرده‌سازی، بریدن، تغییر رزولوشن، تبدیل به GIF و استخراج صدا از ویدیو؛ همه با موتور ffmpeg که داخل مرورگر شما اجرا می‌شود و فایلی آپلود نمی‌شود.",
    icon: Clapperboard,
  },
  {
    slug: "dev",
    title: "برنامه‌نویسی و وب",
    description:
      "ابزارهای کاربردی توسعه‌دهندگان؛ تولید QR Code، مرتب‌سازی و اعتبارسنجی JSON، و کدگذاری Base64 و URL.",
    icon: Code2,
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}
