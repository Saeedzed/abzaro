"use client";

import { useEffect, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";

/**
 * «کپی لینک نتیجه» — puts the current inputs in the URL query string so a
 * calculation can be sent to someone else and reopens with the same numbers.
 *
 * No data leaves the browser: the values are just form state, and the tool
 * reads them back on mount (see `useSharedInputs`).
 */
export function ShareResult({
  params,
  label = "کپی لینک نتیجه",
}: {
  params: Record<string, string | number>;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  function buildUrl(): string {
    const url = new URL(window.location.href);
    url.search = "";
    for (const [key, value] of Object.entries(params)) {
      const text = String(value ?? "").trim();
      if (text !== "" && text !== "0") url.searchParams.set(key, text);
    }
    return url.toString();
  }

  async function share() {
    const url = buildUrl();
    try {
      // Prefer the native share sheet on mobile (#hasOwnProperty check because
      // `navigator.share` is missing in several desktop browsers).
      if (typeof navigator.share === "function") {
        await navigator.share({ title: document.title, url });
        return;
      }
    } catch {
      // user cancelled the share sheet — fall through to copying
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the address bar still updates below.
      window.history.replaceState(null, "", url);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      data-testid="share-result"
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs font-semibold text-ink-700 shadow-card transition hover:border-brand-300 hover:text-brand-800"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
      ) : typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {copied ? "لینک کپی شد" : label}
    </button>
  );
}

/**
 * Read a shared input value from the URL once, on mount.
 * Server render returns the fallback, so the prerendered HTML stays static and
 * there is no hydration mismatch (the state is filled in an effect).
 */
export function useSharedInput(key: string, fallback = ""): [string, (value: string) => void] {
  const [value, setValue] = useState(fallback);

  useEffectOnce(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get(key);
    if (shared !== null && shared !== "") setValue(shared);
  });

  return [value, setValue];
}

/** Tiny mount-only effect (avoids a `useEffect(..., [])` lint argument). */
function useEffectOnce(callback: () => void) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (done) return;
    setDone(true);
    callback();
  }, [done, callback]);
}
