"use client";

import { useMemo, useState } from "react";
import { BadgePercent } from "lucide-react";
import {
  discountByAmount,
  discountByPercent,
  originalPriceFromDiscounted,
} from "@/lib/percent";
import { NumberField, ResultHint, ResultRow, ToolPanel, formatFa, formatToman } from "./shared";

type Mode = "percent" | "amount" | "reverse";

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "percent", label: "تخفیف درصدی" },
  { id: "amount", label: "تخفیف مبلغی" },
  { id: "reverse", label: "قیمت اصلی" },
];

function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Discount calculator: percent off, fixed amount off, and recovering the
 * original price from a discounted one. Client-side only.
 */
export function DiscountCalculator() {
  const [mode, setMode] = useState<Mode>("percent");
  const [price, setPrice] = useState("");
  const [value, setValue] = useState("");

  const numPrice = toNumber(price);
  const numValue = toNumber(value);

  const result = useMemo(() => {
    if (numPrice === null || numValue === null) return null;
    if (mode === "percent") return discountByPercent(numPrice, numValue);
    if (mode === "amount") return discountByAmount(numPrice, numValue);
    return originalPriceFromDiscounted(numPrice, numValue);
  }, [mode, numPrice, numValue]);

  const config = {
    percent: { priceLabel: "قیمت اصلی", priceSuffix: "تومان", valueLabel: "درصد تخفیف", valueSuffix: "٪" },
    amount: { priceLabel: "قیمت اصلی", priceSuffix: "تومان", valueLabel: "مبلغ تخفیف", valueSuffix: "تومان" },
    reverse: { priceLabel: "قیمت بعد از تخفیف", priceSuffix: "تومان", valueLabel: "درصد تخفیف", valueSuffix: "٪" },
  }[mode];

  const invalidPercent =
    mode !== "amount" && numValue !== null && (numValue < 0 || numValue > 100);
  const invalidPrice = numPrice !== null && numPrice < 0;

  function switchMode(next: Mode) {
    setMode(next);
    setPrice("");
    setValue("");
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="نوع محاسبهٔ تخفیف"
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
          icon={<BadgePercent className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        >
          <div className="space-y-4">
            <NumberField
              label={config.priceLabel}
              value={price}
              onChange={setPrice}
              placeholder="500000"
              suffix={config.priceSuffix}
              autoFocus
              min={0}
              error={
                invalidPrice ? "مبلغ نمی‌تواند منفی باشد." : undefined
              }
            />
            <NumberField
              label={config.valueLabel}
              value={value}
              onChange={setValue}
              placeholder={mode === "amount" ? "80000" : "30"}
              suffix={config.valueSuffix}
              min={0}
              max={mode === "amount" ? undefined : 100}
              error={
                invalidPercent
                  ? "درصد تخفیف باید بین ۰ تا ۱۰۰ باشد."
                  : undefined
              }
            />
          </div>
        </ToolPanel>

        <ToolPanel title="نتیجه">
          {result === null ? (
            <ResultHint>
              {invalidPercent
                ? "درصد تخفیف باید بین ۰ تا ۱۰۰ باشد."
                : "قیمت و مقدار تخفیف را وارد کنید."}
            </ResultHint>
          ) : mode === "reverse" && "originalPrice" in result ? (
            <div className="space-y-3">
              <ResultRow
                label="قیمت اصلی"
                value={formatToman(result.originalPrice)}
                emphasize
              />
              <ResultRow label="مبلغ تخفیف" value={formatToman(result.discountAmmount)} />
            </div>
          ) : "finalPrice" in result ? (
            <div className="space-y-3">
              <ResultRow label="قیمت نهایی" value={formatToman(result.finalPrice)} emphasize />
              <ResultRow label="مبلغ تخفیف" value={formatToman(result.discountAmmount)} />
              <ResultRow
                label="درصد تخفیف مؤثر"
                value={`${formatFa(result.effectivePercent)}٪`}
              />
            </div>
          ) : null}
        </ToolPanel>
      </div>

      <p className="mt-4 text-xs leading-6 text-ink-400">
        برای محاسبهٔ قیمت قبل از تخفیف، حالت «قیمت اصلی» را انتخاب کنید. همهٔ
        محاسبات در مرورگر انجام می‌شود.
      </p>
    </div>
  );
}
