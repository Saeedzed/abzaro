"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Fingerprint, RefreshCw } from "lucide-react";
import { HASH_ALGORITHMS, hashText, uuidV4 } from "@/lib/dev-tokens";
import { ToolPanel } from "./shared";
import { cn } from "@/lib/utils";

/**
 * Hash any text with MD5/SHA-1/SHA-256/SHA-384/SHA-512 plus a batch UUID
 * generator. Runs on Web Crypto (with a local MD5 fallback), so it works
 * offline and never sends the input anywhere.
 */
export function HashGenerator() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [UUIDS, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(5);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function compute() {
      const next: Record<string, string> = {};
      for (const algorithm of HASH_ALGORITHMS) {
        try {
          next[algorithm] = await hashText(input, algorithm);
        } catch {
          next[algorithm] = "—";
        }
      }
      if (!cancelled) setHashes(next);
    }
    void compute();
    return () => {
      cancelled = true;
    };
  }, [input]);

  const generateUuids = useCallback(() => {
    setUuids(Array.from({ length: count }, () => uuidV4()));
  }, [count]);

  useEffect(() => {
    generateUuids();
  }, [generateUuids]);

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-4">
      <ToolPanel
        title="متن ورودی"
        description="هش با هر پنج الگوریتم هم‌زمان محاسبه می‌شود."
        icon={<Fingerprint className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <label htmlFor="hash-input" className="sr-only">
          متن برای هش کردن
        </label>
        <textarea
          id="hash-input"
          dir="auto"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={5}
          placeholder="متن دلخواه…"
          data-testid="hash-input"
          className="w-full resize-y rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm leading-7 text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />

        <ul className="mt-3 space-y-2" data-testid="hash-list">
          {HASH_ALGORITHMS.map((algorithm) => (
            <li
              key={algorithm}
              className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50/60 px-3 py-2"
            >
              <span className="w-16 shrink-0 text-[11px] font-bold text-brand-700">{algorithm}</span>
              <code
                dir="ltr"
                data-testid={`hash-${algorithm.toLowerCase()}`}
                className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-left text-[11px] text-ink-700"
              >
                {hashes[algorithm] ?? "…"}
              </code>
              <button
                type="button"
                onClick={() => void copy(hashes[algorithm] ?? "", algorithm)}
                aria-label={`کپی هش ${algorithm}`}
                className="shrink-0 rounded-md p-1 text-ink-400 transition hover:bg-white hover:text-brand-600"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              {copied === algorithm && (
                <span className="shrink-0 text-[10px] font-bold text-emerald-600">کپی شد</span>
              )}
            </li>
          ))}
        </ul>
      </ToolPanel>

      <ToolPanel
        title="تولید UUID (نسخه ۴)"
        description="شناسهٔ یکتا برای پایگاه‌داده و API."
        icon={<RefreshCw className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        action={
          <button
            type="button"
            onClick={generateUuids}
            data-testid="uuid-generate"
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-700"
          >
            تولید دوباره
          </button>
        }
      >
        <label className="flex items-center gap-2 text-[11px] text-ink-500">
          تعداد
          <select
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-brand-400"
          >
            {[1, 5, 10, 25].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <ul className="mt-3 space-y-1.5" data-testid="uuid-list">
          {UUIDS.map((uuid) => (
            <li key={uuid} className="flex items-center gap-2">
              <code
                dir="ltr"
                className={cn(
                  "flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-ink-50 px-2.5 py-1.5 text-left text-[11px] text-ink-700",
                )}
              >
                {uuid}
              </code>
              <button
                type="button"
                onClick={() => void copy(uuid, uuid)}
                aria-label={`کپی ${uuid}`}
                className="shrink-0 rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-brand-600"
              >
                <Copy className="h-3 w-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </ToolPanel>
    </div>
  );
}
