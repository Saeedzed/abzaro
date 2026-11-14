import {
  Calculator,
  Code2,
  FileText,
  FilePen,
  Image as ImageIcon,
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
    title: "ویرایش فایل و PDF",
    description:
      "ابزارهای کار با فایل و PDF؛ تبدیل عکس به PDF، فشرده‌سازی و ادغام PDF، و تبدیل صفحه‌های PDF به تصویر — بدون آپلود فایل.",
    icon: FilePen,
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
