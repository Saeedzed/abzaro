"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "خانه" },
  { href: "/tools", label: "ابزارها" },
  { href: "/categories", label: "دسته‌بندی" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
] as const;

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/90 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label={`${siteConfig.name} — صفحه اصلی`}
          >
            <Logo className="h-10 w-10 transition-transform duration-200 hover:scale-105" />
            <span className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight text-ink-900">
                {siteConfig.name}
              </span>
              <span className="hidden text-[11px] text-ink-500 sm:block">
                {siteConfig.tagline}
              </span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav
            aria-label="ناوبری اصلی"
            className="hidden items-center gap-1 lg:flex"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive(link.href)
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop search → opens the ⌘K palette */}
          <div className="ms-auto hidden w-64 md:block xl:w-80">
            <SearchTrigger />
          </div>

          {/* Theme switch (desktop) */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "بستن منو" : "باز کردن منو"}
            className="ms-auto flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 transition hover:bg-ink-100 md:ms-0 lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </Container>

      {/* Mobile panel */}
      <div
        className={cn(
          "overflow-hidden border-ink-200/70 transition-[max-height] duration-300 lg:hidden",
          mobileOpen ? "max-h-96 border-t" : "max-h-0",
        )}
      >
        <Container className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchTrigger />
            </div>
            <ThemeToggle className="shrink-0 border border-ink-200" />
          </div>
          <nav aria-label="ناوبری موبایل" className="grid gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive(link.href)
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-700 hover:bg-ink-100",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
    </header>
  );
}
