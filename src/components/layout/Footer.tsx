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

          <FooterGroup title="دسترسی سریع" links={QUICK_LINKS} />
          <FooterGroup title="دسته‌بندی‌ها" links={categories.map((category) => ({
            label: category.title, href: `/categories/${category.slug}`,
          }))} />
          <FooterGroup title="ابزارهای پرطرفدار" links={popularTools.slice(0, 5).map((tool) => ({
            label: tool.title, href: `/tools/${tool.slug}`,
          }))} />
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

/** Native disclosure for touch; static headings and links on wider screens. */
function FooterGroup({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  const items = (
    <ul className="mt-3 space-y-2.5 sm:mt-4">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="inline-flex min-h-11 items-center text-sm text-ink-600 transition hover:text-brand-600 sm:min-h-0">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <details className="group border-t border-ink-200 pt-3 sm:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-bold text-ink-900">
          {title}<span className="text-brand-500 transition group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
        <nav aria-label={title} className="footer-nav">{items}</nav>
      </details>
      <div className="hidden sm:block">
        <h2 className="text-sm font-bold text-ink-900">{title}</h2>
        <nav aria-label={title}>{items}</nav>
      </div>
    </>
  );
}
