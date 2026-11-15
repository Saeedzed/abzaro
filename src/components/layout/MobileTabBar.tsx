"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, Shapes } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "خانه", icon: Home },
  { href: "/categories", label: "دسته‌ها", icon: Shapes },
  { href: "/tools", label: "ابزارها", icon: LayoutGrid },
] as const;

/**
 * Phone-only bottom tab bar. Thumb-reachable primary navigation, fixed above
 * the safe-area inset, plus a big search button that opens the command palette.
 * Hidden from `md` up (the header already has the full nav there).
 */
export function MobileTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  function openSearch() {
    // The palette already listens for this event (used by every search trigger).
    window.dispatchEvent(new Event("abzaro:open-search"));
  }

  return (
    <nav
      aria-label="ناوبری پایین"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      data-testid="mobile-tabbar"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition",
                  active ? "text-brand-700" : "text-ink-500",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active && "text-brand-600")}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={openSearch}
            aria-label="جستجوی ابزار"
            data-testid="mobile-tabbar-search"
            className="flex w-full flex-col items-center gap-1 py-2.5 text-[10px] font-semibold text-ink-500"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
            جستجو
          </button>
        </li>
      </ul>
    </nav>
  );
}
