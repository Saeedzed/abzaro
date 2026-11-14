"use client";

import { useMemo, useState } from "react";
import { Banknote, Calculator, Table2 } from "lucide-react";
import { calculateLoan } from "@/lib/finance";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian";
import { NumberField, ResultHint, ResultRow, ToolPanel, formatFa, formatToman } from "./shared";
import { ShareResult, useSharedInput } from "./ShareResult";

function parseNumber(value: string): number | null {
  const normalized = toEnglishDigits(value).replace(/[,٬\s]/g, "");
  if (normalized === "" || !/^\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}

/**
 * Loan instalment calculator (محاسبه اقساط وام) with a full amortisation
 * table. Uses the standard annuity formula; everything runs locally.
 */
export function LoanCalculator() {
  const [amount, setAmount] = useSharedInput("amount", "100000000");
  const [rate, setRate] = useState("23");
  const [months, setMonths] = useState("36");
  const [showTable, setShowTable] = useState(false);

  const principal = parseNumber(amount);
  const annualRate = parseNumber(rate);
  const term = parseNumber(months);

  const result = useMemo(() => {
    if (principal === null || annualRate === null || term === null) return null;
    return calculateLoan({ principal, annualRatePercent: annualRate, months: term });
  }, [principal, annualRate, term]);

  const termError =
    term !== null && term > 600 ? "حداکثر مدت بازپرداخت ۶۰۰ ماه (۵۰ سال) است." : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="مشخصات وام"
        description="مبلغ، نرخ سود سالانه و مدت بازپرداخت را وارد کنید."
        icon={<Banknote className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-4">
          <NumberField
            label="مبلغ وام (تومان)"
            value={amount}
            onChange={setAmount}
            placeholder="۱۰۰٬۰۰۰٬۰۰۰"
            suffix="تومان"
            autoFocus
          />
          <NumberField
            label="نرخ سود سالانه"
            value={rate}
            onChange={setRate}
            placeholder="۲۳"
            suffix="٪"
            step={0.5}
          />
          <NumberField
            label="مدت بازپرداخت"
            value={months}
            onChange={setMonths}
            placeholder="۳۶"
            suffix="ماه"
            error={termError}
          />
          <div className="flex gap-2">
            {[12, 24, 36, 60].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setMonths(String(preset))}
                aria-pressed={term === preset}
                className={
                  term === preset
                    ? "flex-1 rounded-lg border border-brand-300 bg-brand-50 px-2 py-1.5 text-[11px] font-semibold text-brand-700"
                    : "flex-1 rounded-lg border border-ink-200 px-2 py-1.5 text-[11px] font-semibold text-ink-600 transition hover:bg-ink-100"
                }
              >
                {toPersianDigits(preset)} ماه
              </button>
            ))}
          </div>
          <p className="rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-5 text-ink-500">
            نرخ سود رایج بانک‌های ایران ۱۸ تا ۲۳ درصد است؛ اگر وام شما نرخ
            دیگری دارد، همان را وارد کنید.
          </p>
        </div>
      </ToolPanel>

      <ToolPanel
        title="نتیجه"
        description="قسط ماهانه و مجموع بازپرداخت"
        icon={<Calculator className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        {result ? (
          <div className="space-y-3">
            <ResultRow
              label="قسط ماهانه"
              value={formatToman(result.monthlyPayment)}
              emphasize
              hint="این مبلغ را هر ماه پرداخت می‌کنید"
            />
            <ResultRow label="مجموع بازپرداخت" value={formatToman(result.totalPayment)} />
            <ResultRow
              label="مجموع سود"
              value={formatToman(result.totalInterest)}
              hint={`${formatFa(
                principal ? Math.round((result.totalInterest / principal) * 100) : 0,
                0,
              )}٪ مبلغ وام`}
            />
            <ResultRow
              label="تعداد اقساط"
              value={`${formatFa(result.schedule.length, 0)} ماه`}
              copyable={false}
            />

            <ShareResult params={{ amount, rate, months }} />

            <button
              type="button"
              onClick={() => setShowTable((value) => !value)}
              data-testid="loan-table-toggle"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
            >
              <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
              {showTable ? "بستن جدول بازپرداخت" : "نمایش جدول بازپرداخت"}
            </button>

            {showTable && (
              <div
                className="max-h-64 overflow-auto rounded-xl border border-ink-200"
                data-testid="loan-table"
              >
                <table className="w-full text-right text-[11px]">
                  <thead className="sticky top-0 bg-ink-100 text-ink-700">
                    <tr>
                      <th className="px-2 py-1.5 font-semibold">ماه</th>
                      <th className="px-2 py-1.5 font-semibold">قسط</th>
                      <th className="px-2 py-1.5 font-semibold">سود</th>
                      <th className="px-2 py-1.5 font-semibold">مانده</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.schedule.map((row) => (
                      <tr key={row.month} className="border-t border-ink-100 odd:bg-white even:bg-ink-50/50">
                        <td className="px-2 py-1.5 text-ink-600">{toPersianDigits(row.month)}</td>
                        <td className="px-2 py-1.5 font-semibold text-ink-900">
                          {formatFa(row.payment, 0)}
                        </td>
                        <td className="px-2 py-1.5 text-ink-500">{formatFa(row.interest, 0)}</td>
                        <td className="px-2 py-1.5 text-ink-600">{formatFa(row.balance, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <ResultHint>مبلغ، نرخ سود و مدت را وارد کنید تا قسط محاسبه شود.</ResultHint>
        )}
      </ToolPanel>
    </div>
  );
}
