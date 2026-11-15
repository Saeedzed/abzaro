"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";

import { useSession } from "@/lib/use-session";

/**
 * Header account slot.
 *
 * Renders nothing until the session has been read from storage, so the
 * prerendered HTML is identical for every visitor and there is no flash of
 * "log in" for someone who is already signed in.
 */
export function HeaderAccount() {
  const { session, ready } = useSession();

  if (!ready) return <span className="hidden h-9 w-9 sm:block" aria-hidden="true" />;

  if (!session) {
    return (
      <Link
        href="/login"
        data-testid="header-login"
        className="hidden items-center gap-1.5 rounded-xl border border-ink-200 px-3 py-2 text-xs font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700 sm:flex"
      >
        <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
        ورود
      </Link>
    );
  }

  const initial = session.name.trim().charAt(0) || "؟";

  return (
    <Link
      href="/dashboard"
      data-testid="header-profile"
      aria-label={`پروفایل ${session.name}`}
      className="flex items-center gap-2 rounded-xl border border-ink-200 py-1 pe-3 ps-1 transition hover:border-brand-300"
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-emerald-500 text-xs font-extrabold text-white">
        {initial}
      </span>
      <span className="hidden max-w-24 truncate text-xs font-bold text-ink-800 sm:block">
        {session.name}
      </span>
    </Link>
  );
}
