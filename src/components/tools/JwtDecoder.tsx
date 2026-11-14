"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, KeyRound } from "lucide-react";
import { decodeJwt } from "@/lib/dev-tokens";
import { toPersianDigits } from "@/lib/persian";
import { ToolPanel } from "./shared";
import { cn } from "@/lib/utils";

const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImFsaSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

function faDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

/**
 * Decode (not verify) a JWT: header, payload, expiry status. The UI says
 * explicitly that the signature is not checked — decoding a token is not the
 * same as trusting it.
 */
export function JwtDecoder() {
  const [token, setToken] = useState("");

  const result = useMemo(() => decodeJwt(token), [token]);
  const hasInput = token.trim().length > 0;

  return (
    <div className="space-y-4">
      <ToolPanel
        title="توکن JWT"
        description="توکن را بچسبانید؛ کلمهٔ «Bearer» هم پذیرفته می‌شود."
        icon={<KeyRound className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        action={
          <button
            type="button"
            onClick={() => setToken(SAMPLE)}
            className="rounded-lg border border-ink-200 px-2.5 py-1 text-[11px] font-medium text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            نمونه
          </button>
        }
      >
        <label htmlFor="jwt-input" className="sr-only">
          توکن JWT
        </label>
        <textarea
          id="jwt-input"
          dir="ltr"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          rows={4}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
          data-testid="jwt-input"
          className="code-pane w-full resize-y rounded-xl border border-ink-200 bg-white px-4 py-3 text-xs leading-6 text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
        <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-6 text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          امضا (signature) بررسی نمی‌شود؛ این ابزار فقط محتوای توکن را نشان می‌دهد.
          برای اعتبارسنجی واقعی باید امضا در سرور با کلید مخفی کنترل شود.
        </p>
      </ToolPanel>

      {hasInput && !result.ok && (
        <p role="alert" data-testid="jwt-error" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {result.error}
        </p>
      )}

      {hasInput && result.ok && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="الگوریتم" value={result.parts.algorithm ?? "—"} />
            <MiniStat label="نوع" value={result.parts.type ?? "—"} />
            <MiniStat
              label="وضعیت انقضا"
              value={
                result.parts.expired === null
                  ? "بدون exp"
                  : result.parts.expired
                    ? "منقضی شده"
                    : "معتبر"
              }
              tone={
                result.parts.expired === null
                  ? "neutral"
                  : result.parts.expired
                    ? "danger"
                    : "success"
              }
            />
          </div>

          {result.parts.expiresAt && (
            <p className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-2 text-[11px] text-ink-600">
              <Clock className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
              انقضا: {faDate(result.parts.expiresAt)}
              {result.parts.expiresInSeconds !== null && (
                <> · {toPersianDigits(Math.abs(Math.round(result.parts.expiresInSeconds / 60)))} دقیقه {result.parts.expired ? "پیش" : "باقی"}</>
              )}
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <CodeBlock title="Header" json={result.parts.headerJson} testId="jwt-header" />
            <CodeBlock title="Payload" json={result.parts.payloadJson} testId="jwt-payload" />
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-2.5 text-center shadow-card",
        tone === "success" && "border-emerald-200 bg-emerald-50",
        tone === "danger" && "border-red-200 bg-red-50",
        tone === "neutral" && "border-ink-200 bg-white",
      )}
    >
      <p className="text-[11px] text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-ink-900">{value}</p>
    </div>
  );
}

function CodeBlock({ title, json, testId }: { title: string; json: string; testId: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card">
      <p className="flex items-center gap-1.5 text-xs font-bold text-ink-800">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
        {title}
      </p>
      <pre
        dir="ltr"
        data-testid={testId}
        className="code-pane mt-2 max-h-72 overflow-auto rounded-xl bg-ink-50 px-3 py-2 text-left text-[11px] leading-6 text-ink-800"
      >
        {json}
      </pre>
    </div>
  );
}
