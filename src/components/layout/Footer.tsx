import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Container } from "@/components/layout/Container";
import { categories } from "@/data/categories";
import { popularTools } from "@/data/tools";
import { siteConfig } from "@/config/site";

const QUICK_LINKS = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/tools", label: "همه ابزارها" },
  { href: "/categories", label: "دسته‌بندی‌ها" },
  { href: "/how-it-works", label: "چطور کار می‌کند؟" },
  { href: "/compare", label: "مقایسه با سایت‌های مشابه" },
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
              <Logo className="h-9 w-9" />
              <span className="text-lg font-extrabold text-ink-900">
                {siteConfig.name}
              </span>
            </Link>
            <p className="mt-4 text-sm leading-7 text-ink-600">
              {siteConfig.description}
            </p>
          </div>

          {/* Quick links — collapsible on phones, always open from sm up */}
          <details className="group border-t border-ink-200 pt-3 sm:border-0 sm:pt-0 sm:open">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-ink-900 sm:pointer-events-none">
              دسترسی سریع
              <span className="text-brand-500 transition group-open:rotate-45 sm:hidden">+</span>
            </summary>
            <nav aria-label="دسترسی سریع" className="footer-nav">
            <ul className="mt-3 space-y-2.5 sm:mt-4">
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
          </details>

          {/* Categories */}
          <details className="group border-t border-ink-200 pt-3 sm:border-0 sm:pt-0 sm:open">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-ink-900 sm:pointer-events-none">
              دسته‌بندی‌ها
              <span className="text-brand-500 transition group-open:rotate-45 sm:hidden">+</span>
            </summary>
            <nav aria-label="دسته‌بندی ابزارها" className="footer-nav">
            <ul className="mt-3 space-y-2.5 sm:mt-4">
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
          </details>

          {/* Popular tools */}
          <details className="group border-t border-ink-200 pt-3 sm:border-0 sm:pt-0 sm:open">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-ink-900 sm:pointer-events-none">
              ابزارهای پرطرفدار
              <span className="text-brand-500 transition group-open:rotate-45 sm:hidden">+</span>
            </summary>
            <nav aria-label="ابزارهای پرطرفدار" className="footer-nav">
            <ul className="mt-3 space-y-2.5 sm:mt-4">
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
          </details>
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
