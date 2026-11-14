import Link from "next/link";
import { Wrench } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { categories } from "@/data/categories";
import { popularTools } from "@/data/tools";
import { siteConfig } from "@/config/site";

const QUICK_LINKS = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/tools", label: "همه ابزارها" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/about", label: "درباره ابزارو" },
  { href: "/contact", label: "تماس با ما" },
  { href: "/privacy", label: "حریم خصوصی" },
] as const;

export function Footer() {
  const persianYear = new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
  }).format(new Date());

  return (
    <footer className="border-t border-ink-200 bg-ink-50">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Wrench className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-extrabold text-ink-900">
                {siteConfig.name}
              </span>
            </Link>
            <p className="mt-4 text-sm leading-7 text-ink-600">
              {siteConfig.description}
            </p>
          </div>

          {/* Quick links */}
          <nav aria-label="دسترسی سریع">
            <h3 className="text-sm font-bold text-ink-900">دسترسی سریع</h3>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-600 transition hover:text-brand-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Categories */}
          <nav aria-label="دسته‌بندی ابزارها">
            <h3 className="text-sm font-bold text-ink-900">دسته‌بندی‌ها</h3>
            <ul className="mt-4 space-y-2.5">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="text-sm text-ink-600 transition hover:text-brand-600"
                  >
                    {category.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Popular tools */}
          <nav aria-label="ابزارهای پرطرفدار">
            <h3 className="text-sm font-bold text-ink-900">ابزارهای پرطرفدار</h3>
            <ul className="mt-4 space-y-2.5">
              {popularTools.slice(0, 5).map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="text-sm text-ink-600 transition hover:text-brand-600"
                  >
                    {tool.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-200 pt-6 text-xs text-ink-500 sm:flex-row">
          <p>
            © {persianYear} {siteConfig.name} — تمامی حقوق محفوظ است.
          </p>
          <p>ساخته‌شده با ❤️ برای کاربران فارسی‌زبان</p>
        </div>
      </Container>
    </footer>
  );
}
