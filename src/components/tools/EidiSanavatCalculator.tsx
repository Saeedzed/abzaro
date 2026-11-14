"use client";

import { useMemo } from "react";
import { Gift, HandCoins } from "lucide-react";
import {
  MIN_MONTHLY_WAGE_1404,
  PAYROLL_YEAR,
  calculateEidi,
  calculateSanavat,
} from "@/lib/payroll";
import { NumberField, ResultHint, ResultRow, ToolPanel, formatFa, formatToman } from "./shared";
import { ShareResult, useSharedInput } from "./ShareResult";

function parseAmount(value: string): number {
  const normalized = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,٬\s]/g, "");
  if (normalized === "") return 0;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
}

/** عیدی و سنوات — پایان سال، بر اساس قانون کار. */
export function EidiSanavatCalculator() {
  const [wage, setWage] = useSharedInput("wage", String(MIN_MONTHLY_WAGE_1404));
  const [months, setMonths] = useSharedInput("months", "12");
  const [years, setYears] = useSharedInput("years", "1");

  const monthly = parseAmount(wage);
  const monthsWorked = parseAmount(months);
  const yearsWorked = parseAmount(years);

  const eidi = useMemo(
    () => calculateEidi({ monthlyWage: monthly, monthsWorked }),
    [monthly, monthsWorked],
  );
  const sanavat = useMemo(
    () => calculateSanavat({ monthlyWage: monthly, years: yearsWorked }),
    [monthly, yearsWorked],
  );

  const total = (eidi?.net ?? 0) + (sanavat ?? 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="ورودی‌ها"
        description={`مبنا: حداقل حقوق ${formatFa(PAYROLL_YEAR, 0)}`}
        icon={<HandCoins className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-4">
          <NumberField
            label="آخرین حقوق ماهانه (تومان)"
            value={wage}
            onChange={setWage}
            placeholder={String(MIN_MONTHLY_WAGE_1404)}
            suffix="تومان"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="ماه‌های کارکرد در سال"
              value={months}
              onChange={setMonths}
              suffix="ماه"
            />
            <NumberField
              label="سابقه (سال)"
              value={years}
              onChange={setYears}
              suffix="سال"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[12, 9, 6, 3].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setMonths(String(preset))}
                className={
                  monthsWorked === preset
                    ? "rounded-full border border-brand-500 bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700"
                    : "rounded-full border border-ink-200 bg-white px-3 py-1 text-[11px] font-semibold text-ink-600 transition hover:border-brand-300"
                }
              >
                {formatFa(preset, 0)} ماه
              </button>
            ))}
          </div>

          <p className="rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-6 text-ink-500">
            عیدی = دو برابر حقوق ماهانه به نسبت ماه‌های کارکرد، بین ۲ و ۳ برابر
            حداقل حقوق مصوب ({formatToman(MIN_MONTHLY_WAGE_1404)}). سنوات = یک ماه
            حقوق برای هر سال سابقه.
          </p>
        </div>
      </ToolPanel>

      <ToolPanel
        title="نتیجه"
        description="عیدی، سنوات و جمع آن‌ها"
        icon={<Gift className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        {eidi && sanavat !== null ? (
          <div className="space-y-3">
            <ResultRow
              label="جمع عیدی و سنوات"
              value={formatToman(total)}
              emphasize
              testId="eidi-total"
            />
            <ResultRow
              label="عیدی خالص"
              value={formatToman(eidi.net)}
              testId="eidi-net"
              hint={
                eidi.tax > 0
                  ? `پس از کسر ${formatToman(eidi.tax)} مالیات`
                  : "معاف از مالیات"
              }
            />
            <ResultRow
              label="سنوات (پاداش پایان خدمت)"
              value={formatToman(sanavat)}
              testId="sanavat"
            />
            <ResultRow
              label="حداقل قانونی عیدی"
              value={formatToman(eidi.floor)}
              copyable={false}
            />
            <ShareResult params={{ wage, months, years }} />
            <ResultRow
              label="سقف قانونی عیدی"
              value={formatToman(eidi.ceiling)}
              copyable={false}
            />
            {eidi.cappedAtCeiling && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-6 text-amber-800">
                عیدی محاسبه‌شده از سقف قانونی (سه برابر حداقل حقوق) بیشتر بود، پس
                سقف اعمال شد.
              </p>
            )}
          </div>
        ) : (
          <ResultHint>حقوق ماهانه را وارد کنید تا عیدی و سنوات محاسبه شود.</ResultHint>
        )}
      </ToolPanel>
    </div>
  );
}
