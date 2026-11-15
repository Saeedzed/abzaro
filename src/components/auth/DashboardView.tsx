"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  History,
  LogOut,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import { IconTile } from "@/components/ui/IconTile";
import { tools } from "@/data/tools";
import { deleteAccount } from "@/lib/local-auth";
import { toPersianDigits } from "@/lib/persian";
import { useRecentTools, useSavedTools } from "@/lib/use-recent-tools";
import { useSession } from "@/lib/use-session";

const bySlug = (slug: string) => tools.find((tool) => tool.slug === slug);

export default function DashboardView() {
  const router = useRouter();
  const { session, ready, signOut } = useSession();
  const { slugs: recent } = useRecentTools(session?.id ?? null);
  const { slugs: saved, ready: savedReady, toggle } = useSavedTools(session?.id ?? null);
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !session) router.replace("/login");
  }, [mounted, session, router]);

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    const pool = tools.filter((tool) => !saved.includes(tool.slug));
    if (!term) return pool.slice(0, 6);
    return pool
      .filter(
        (tool) =>
          tool.title.toLowerCase().includes(term) ||
          tool.slug.includes(term) ||
          tool.keywords.some((keyword) => keyword.toLowerCase().includes(term)),
      )
      .slice(0, 6);
  }, [query, saved]);

  if (!mounted || !ready || !session) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-slate-500">
        در حال خواندن پروفایل…
      </div>
    );
  }

  const recentTools = recent.map(bySlug).filter(Boolean).slice(0, 6) as typeof tools;
  const savedTools = saved.map(bySlug).filter(Boolean) as typeof tools;
  const initial = session.name.trim().charAt(0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      {/* header */}
      <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 text-xl font-extrabold text-white">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <h1 data-testid="dash-name" className="truncate text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {session.name}
          </h1>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400" dir="ltr">
            {session.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/tools"
            className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-700"
          >
            همهٔ ابزارها
          </Link>
          <button
            type="button"
            data-testid="dash-signout"
            onClick={() => {
              signOut();
              router.replace("/login");
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            خروج
          </button>
        </div>
      </header>

      <p className="mt-3 flex items-center gap-1.5 px-1 text-[11px] text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
        این پروفایل روی همین مرورگر ذخیره شده است؛ رمز شما هش شده و جایی ارسال نمی‌شود.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* recent */}
        <section
          data-testid="dash-recent"
          className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
        >
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <History className="h-4 w-4 text-brand-600" aria-hidden="true" />
            ابزارهای اخیر شما
          </h2>
          {recentTools.length === 0 ? (
            <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
              هنوز هیچ ابزاری باز نکرده‌اید. اولین ابزار را باز کنید تا اینجا بماند.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {recentTools.map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <IconTile icon={tool.icon} size="sm" />
                    <span className="flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                      {tool.title}
                    </span>
                    <ArrowLeft className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* saved */}
        <section
          data-testid="dash-saved"
          className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
        >
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Bookmark className="h-4 w-4 text-amber-500" aria-hidden="true" />
            ابزارهای ذخیره‌شده
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {toPersianDigits(savedTools.length)}
            </span>
          </h2>

          {savedReady && savedTools.length === 0 ? (
            <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
              از فهرست زیر هر ابزاری را که زیاد استفاده می‌کنید ذخیره کنید.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {savedTools.map((tool) => (
                <li key={tool.id} className="flex items-center gap-2">
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <IconTile icon={tool.icon} size="sm" />
                    <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                      {tool.title}
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label={`حذف ${tool.title} از ذخیره‌شده‌ها`}
                    data-testid={`dash-unsave-${tool.slug}`}
                    onClick={() => toggle(tool.slug)}
                    className="rounded-lg p-1.5 text-amber-500 transition hover:bg-amber-50"
                  >
                    <BookmarkCheck className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="relative">
              <Search className="pointer-events-none absolute end-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                data-testid="dash-search"
                placeholder="جست‌وجوی ابزار برای ذخیره…"
                className="w-full rounded-xl border border-slate-200 py-2 pe-9 ps-3 text-xs outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {suggestions.map((tool) => (
                <li key={tool.id}>
                  <button
                    type="button"
                    data-testid={`dash-save-${tool.slug}`}
                    onClick={() => toggle(tool.slug)}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300"
                  >
                    <Bookmark className="h-3 w-3" aria-hidden="true" />
                    {tool.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* account */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <UserRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
          حساب
        </h2>
        <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-slate-400">نام</dt>
            <dd className="font-semibold text-slate-700 dark:text-slate-200">{session.name}</dd>
          </div>
          <div>
            <dt className="text-slate-400">شناسه</dt>
            <dd className="font-semibold text-slate-700 dark:text-slate-200" dir="ltr">
              {session.id}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">تاریخ ساخت</dt>
            <dd className="font-semibold text-slate-700 dark:text-slate-200">
              {new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(
                new Date(session.createdAt),
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          {confirmDelete ? (
            <>
              <p className="flex-1 text-[11px] text-rose-600">
                پروفایل و تاریخچهٔ ابزارها برای همیشه از این مرورگر حذف می‌شود. مطمئنید؟
              </p>
              <button
                type="button"
                data-testid="dash-delete-confirm"
                onClick={() => {
                  deleteAccount(session.id);
                  router.replace("/login");
                }}
                className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
              >
                بله، حذف کن
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                انصراف
              </button>
            </>
          ) : (
            <button
              type="button"
              data-testid="dash-delete"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 transition hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              حذف حساب و همهٔ داده‌های محلی
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
