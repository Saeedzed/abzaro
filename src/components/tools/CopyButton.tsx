"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Small inline "copy this value" button used by result boxes. */
export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the value is visible anyway */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ?? "کپی"}
      className="ms-1.5 inline-flex min-h-7 items-center gap-1 rounded-md px-1.5 align-middle text-[11px] font-medium text-brand-600 transition hover:bg-brand-50"
    >
      {copied ? (
        <Check className="h-3 w-3" aria-hidden="true" />
      ) : (
        <Copy className="h-3 w-3" aria-hidden="true" />
      )}
      {copied ? "کپی شد" : "کپی"}
    </button>
  );
}
