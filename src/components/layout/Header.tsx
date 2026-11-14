"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Wrench, X } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { SearchBox } from "@/components/search/SearchBox";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "خانه" },
  { href: "/tools", label: "ابزارها" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
] as const;

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-card">
              <Wrench className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-extrabold text-ink-900">
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
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop search */}
          <div className="ms-auto hidden w-64 md:block xl:w-80">
            <SearchBox />
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
          <SearchBox />
          <nav aria-label="ناوبری موبایل" className="grid gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-100"
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
