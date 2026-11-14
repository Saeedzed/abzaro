"use client";

import { useMemo, useState } from "react";
import { Coins, Landmark } from "lucide-react";
import { formatFa, formatToman, NumberField, ToolPanel, ResultRow } from "./shared";
import { toEnglishDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

type Mode = "simple" | "compound";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "simple", label: "سود ساده", hint: "سپردهٔ کوتاه‌مدت؛ سود هر سال فقط روی اصل پول" },
  { id: "compound", label: "سود مرکب", hint: "سود هر دوره به اصل اضافه می‌شود و خودش سود می‌دهد" },
];

/** Banking deposit interest: simple and compound, monthly or yearly payout. */
export function BankInterestCalculator() {
  const [principal, setPrincipal] = useState("100000000");
  const [rate, setRate] = useState("23");
  const [months, setMonths] = useState("12");
  const [mode, setMode] = useState<Mode>("simple");

  const result = useMemo(() => {
    const p = Number(toEnglishDigits(principal).replace(/[,٬\s]/g, ""));
    const r = Number(toEnglishDigits(rate));
    const m = Number(toEnglishDigits(months));

    if (!Number.isFinite(p) || !Number.isFinite(r) || !Number.isFinite(m)) return null;
    if (p <= 0 || r < 0 || m <= 0) return null;

    const monthlyRate = r / 100 / 12;

    if (mode === "simple") {
      const profit = p * (r / 100) * (m / 12);
      return {
        profit: Math.round(profit),
        total: Math.round(p + profit),
        monthly: Math.round(profit / m),
        effectiveRate: r,
        periods: Math.ceil(m),
      };
    }

    const total = p * Math.pow(1 + monthlyRate, m);
    const profit = total - p;
    // Annualised effective rate (nominal is compounded monthly here).
    const effectiveRate = (Math.pow(1 + monthlyRate, 12) - 1) * 100;

    return {
      profit: Math.round(profit),
      total: Math.round(total),
      monthly: Math.round(profit / m),
      effectiveRate,
      periods: Math.ceil(m),
    };
  }, [principal, rate, months, mode]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {MODES.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setMode(option.id)}
            aria-pressed={mode === option.id}
            data-testid={`interest-mode-${option.id}`}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-semibold transition",
              mode === option.id
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-6 text-ink-500">
        {MODES.find((option) => option.id === mode)?.hint}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPanel
          title="مشخصات سپرده"
          description="مبلغ، نرخ سود سالانه و مدت نگه‌داری پول."
          icon={<Landmark className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        >
          <div className="space-y-3">
            <NumberField
              label="مبلغ سپرده (تومان)"
              value={principal}
              onChange={setPrincipal}
              suffix="تومان"
              placeholder="100000000"
            />
            <NumberField
              label="نرخ سود سالانه"
              value={rate}
              onChange={setRate}
              suffix="٪"
              step={0.5}
              placeholder="23"
            />
            <NumberField
              label="مدت (ماه)"
              value={months}
              onChange={setMonths}
              suffix="ماه"
              placeholder="12"
            />
            <div className="flex flex-wrap gap-2">
              {[6, 12, 24, 36].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMonths(String(value))}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition",
                    months === String(value)
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-ink-200 text-ink-500 hover:border-brand-300",
                  )}
                >
                  {formatFa(value, 0)} ماه
                </button>
              ))}
            </div>
          </div>
        </ToolPanel>

        <ToolPanel
          title="نتیجه"
          description="سود و مبلغ نهایی در پایان دوره."
          icon={<Coins className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        >
          {result ? (
            <div className="space-y-2">
              <ResultRow label="سود کل" value={formatToman(result.profit)} emphasize testId="interest-profit" />
              <ResultRow label="مبلغ نهایی" value={formatToman(result.total)} testId="interest-total" />
              <ResultRow label="سود ماهانه (میانگین)" value={formatToman(result.monthly)} />
              <ResultRow
                label="نرخ مؤثر سالانه"
                value={`${formatFa(result.effectiveRate, 2)}٪`}
                testId="interest-effective"
              />
              <p className="mt-2 rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-6 text-ink-500">
                محاسبه بر پایهٔ نرخ اسمی سالانه است؛ سود مرکب با compounding ماهانه
                حساب می‌شود. کارمزد و مالیات بانک در این محاسبه نیست.
              </p>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-6 text-center text-sm text-ink-400">
              مبلغ، نرخ و مدت را وارد کنید.
            </p>
          )}
        </ToolPanel>
      </div>
    </div>
  );
}
