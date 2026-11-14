"use client";

import { useMemo, useState } from "react";
import { Percent, TrendingDown, TrendingUp } from "lucide-react";
import { percentChange, percentOf, whatPercent } from "@/lib/percent";
import { NumberField, ResultHint, ResultRow, ToolPanel, formatFa } from "./shared";
import { ShareResult, useSharedInput } from "./ShareResult";

type Mode = "of" | "what" | "change";

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "of", label: "درصد از عدد" },
  { id: "what", label: "چند درصد است؟" },
  { id: "change", label: "تغییر درصدی" },
];

function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Three-way percentage calculator: percent-of, ratio-as-percent, and
 * percentage change. Pure client-side maths.
 */
export function PercentageCalculator() {
  const [mode, setMode] = useState<Mode>("of");
  const [a, setA] = useSharedInput("a");
  const [b, setB] = useSharedInput("b");

  const numA = toNumber(a);
  const numB = toNumber(b);

  const result = useMemo(() => {
    if (numA === null || numB === null) return null;
    if (mode === "of") {
      const value = percentOf(numA, numB);
      return value === null ? null : { kind: "of" as const, value };
    }
    if (mode === "what") {
      const value = whatPercent(numA, numB);
      return value === null ? null : { kind: "what" as const, value };
    }
    const change = percentChange(numA, numB);
    return change === null ? null : { kind: "change" as const, ...change };
  }, [mode, numA, numB]);

  const labels = {
    of: { first: "درصد", second: "عدد کل", firstSuffix: "٪", secondSuffix: undefined },
    what: { first: "مقدار جزء", second: "مقدار کل", firstSuffix: undefined, secondSuffix: undefined },
    change: { first: "مقدار اول", second: "مقدار دوم", firstSuffix: undefined, secondSuffix: undefined },
  }[mode];

  function switchMode(next: Mode) {
    setMode(next);
    setA("");
    setB("");
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="نوع محاسبهٔ درصد"
        className="flex flex-wrap gap-2 rounded-2xl border border-ink-200 bg-white p-2 shadow-card"
      >
        {MODES.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={mode === item.id}
            onClick={() => switchMode(item.id)}
            className={
              mode === item.id
                ? "flex-1 rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white transition"
                : "flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-600 transition hover:bg-ink-100"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <ToolPanel
          title="مقادیر"
          icon={<Percent className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        >
          <div className="space-y-4">
            <NumberField
              label={labels.first}
              value={a}
              onChange={setA}
              placeholder={mode === "of" ? "20" : "25"}
              suffix={labels.firstSuffix}
              autoFocus
            />
            <NumberField
              label={labels.second}
              value={b}
              onChange={setB}
              placeholder={mode === "of" ? "500" : "200"}
              suffix={labels.secondSuffix}
            />
          </div>
        </ToolPanel>

        <ToolPanel title="نتیجه">
          {result === null ? (
            <ResultHint>
              {mode === "what" && numB === 0
                ? "مقدار کل نمی‌تواند صفر باشد."
                : "برای دیدن نتیجه، هر دو مقدار را وارد کنید."}
            </ResultHint>
          ) : result.kind === "of" ? (
            <div className="space-y-3">
              <ResultRow label="مقدار" value={formatFa(result.value)} emphasize />
              <p className="text-xs leading-6 text-ink-500">
                {formatFa(numA ?? 0)} درصد از {formatFa(numB ?? 0)} برابر{" "}
                {formatFa(result.value)} است.
              </p>
              <ShareResult params={{ mode, a, b }} />
            </div>
          ) : result.kind === "what" ? (
            <div className="space-y-3">
              <ResultRow label="درصد" value={`${formatFa(result.value)}٪`} emphasize />
              <p className="text-xs leading-6 text-ink-500">
                {formatFa(numA ?? 0)} برابر {formatFa(result.value)} درصد از{" "}
                {formatFa(numB ?? 0)} است.
              </p>
              <ShareResult params={{ mode, a, b }} />
            </div>
          ) : (
            <div className="space-y-3">
              <ResultRow
                label={result.direction === "decrease" ? "کاهش" : "افزایش"}
                value={`${result.change > 0 ? "+" : ""}${formatFa(result.change)}٪`}
                emphasize
              />
              <div className="flex items-start gap-2 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-6 text-ink-600">
                {result.direction === "decrease" ? (
                  <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                ) : (
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                )}
                <span>
                  {result.direction === "same"
                    ? "مقدار تغییری نکرده است."
                    : `مقدار از ${formatFa(numA ?? 0)} به ${formatFa(numB ?? 0)} ${
                        result.direction === "increase" ? "افزایش" : "کاهش"
                      } یافته است.`}
                </span>
              </div>
            </div>
          )}
        </ToolPanel>
      </div>

      <p className="mt-4 text-xs leading-6 text-ink-400">
        محاسبات در مرورگر شما انجام می‌شود و هیچ داده‌ای ارسال نمی‌گردد.
      </p>
    </div>
  );
}
