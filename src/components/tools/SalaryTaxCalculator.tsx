"use client";

import { useMemo } from "react";
import { BadgeCheck, Receipt, Wallet } from "lucide-react";
import {
  EMPLOYEE_INSURANCE_RATE,
  HOUSING_ALLOWANCE_1404,
  MIN_MONTHLY_WAGE_1404,
  PAYROLL_YEAR,
  calculateSalary,
} from "@/lib/payroll";
import { ResultHint, ResultRow, ToolPanel, formatFa, formatToman } from "./shared";
import { NumberField } from "./shared";
import { ShareResult, useSharedInput } from "./ShareResult";

/** Parse a Persian/Latin number with separators; empty → 0. */
function parseAmount(value: string): number {
  const normalized = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,٬\s]/g, "");
  if (normalized === "") return 0;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
}

/**
 * ماشین‌حساب حقوق و مالیات بر درآمد (سال ۱۴۰۴).
 * Payslip view: gross → insurance → taxable → bracketed tax → net.
 */
export function SalaryTaxCalculator() {
  const [base, setBase] = useSharedInput("base", "30000000");
  const [extras, setExtras] = useSharedInput("extras", "0");
  const [exempt, setExempt] = useSharedInput("exempt", String(HOUSING_ALLOWANCE_1404));

  const result = useMemo(
    () =>
      calculateSalary({
        baseSalary: parseAmount(base),
        taxableExtras: parseAmount(extras),
        exemptExtras: parseAmount(exempt),
      }),
    [base, extras, exempt],
  );

  const belowMinWage = parseAmount(base) > 0 && parseAmount(base) < MIN_MONTHLY_WAGE_1404;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="اطلاعات حقوق"
        description={`معافیت‌ها و پله‌های مالیاتی سال ${formatFa(PAYROLL_YEAR, 0)}`}
        icon={<Wallet className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-4">
          <NumberField
            label="حقوق پایه و مزایای مشمول (تومان)"
            value={base}
            onChange={setBase}
            placeholder="۲۰٬۰۰۰٬۰۰۰"
            suffix="تومان"
            autoFocus
          />
          <NumberField
            label="اضافه‌کاری / حق اولاد و سایر مزایای مشمول"
            value={extras}
            onChange={setExtras}
            placeholder="۰"
            suffix="تومان"
          />
          <NumberField
            label="مزایای معاف از مالیات (حق مسکن، بن)"
            value={exempt}
            onChange={setExempt}
            placeholder={String(HOUSING_ALLOWANCE_1404)}
            suffix="تومان"
          />

          <ul className="space-y-1.5 rounded-xl bg-ink-50 px-3 py-2.5 text-[11px] leading-6 text-ink-500">
            <li>
              بیمهٔ سهم کارگر {formatFa(EMPLOYEE_INSURANCE_RATE * 100, 0)}٪ از حقوق و مزایای
              مشمول کسر می‌شود.
            </li>
            <li>تا ۲۴ میلیون تومان درآمد ماهانه مشمول مالیات نیست.</li>
            <li>پله‌ها: ۱۰٪ (۲۴ تا ۳۰) · ۱۵٪ (۳۰ تا ۳۸) · ۲۰٪ (۳۸ تا ۵۰) · ۲۵٪ (۵۰ تا ۶۶٫۶) · ۳۰٪ (بالاتر).</li>
            <li>
              حداقل حقوق مصوب {formatFa(PAYROLL_YEAR, 0)}: {formatToman(MIN_MONTHLY_WAGE_1404)}
            </li>
          </ul>

          {belowMinWage && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-6 text-amber-800">
              مبلغ وارد‌شده کمتر از حداقل حقوق مصوب سال است. برای محاسبهٔ درست،
              حقوق قانونی سال جاری را وارد کنید.
            </p>
          )}
        </div>
      </ToolPanel>

      <ToolPanel
        title="فیش حقوقی"
        description="از حقوق ناخالص تا پرداختی خالص"
        icon={<Receipt className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        {result ? (
          <div className="space-y-3">
            <ResultRow
              label="پرداختی خالص ماهانه"
              value={formatToman(result.net)}
              emphasize
              testId="salary-net"
            />
            <ResultRow label="حقوق ناخالص" value={formatToman(result.gross)} />
            <ResultRow
              label="بیمهٔ سهم کارگر"
              value={formatToman(result.insurance)}
              hint={`${formatFa(EMPLOYEE_INSURANCE_RATE * 100, 0)}٪ از ناخالص`}
            />
            <ResultRow
              label="مالیات ماهانه"
              value={formatToman(result.tax)}
              testId="salary-tax"
              hint={`نرخ مؤثر ${formatFa(result.effectiveRate * 100, 1)}٪`}
            />

            <ShareResult params={{ base, extras, exempt }} />

            {result.lines.length > 0 && (
              <div className="rounded-xl border border-ink-200" data-testid="salary-brackets">
                <div className="border-b border-ink-100 bg-ink-50 px-3 py-2 text-[11px] font-semibold text-ink-600">
                  تفکیک پله‌های مالیاتی
                </div>
                <ul className="divide-y divide-ink-100">
                  {result.lines.map((line) => (
                    <li
                      key={line.label}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-[11px]"
                    >
                      <span className="text-ink-600">{line.label}</span>
                      <span className="text-ink-400">{formatFa(line.rate * 100, 0)}٪</span>
                      <span className="font-semibold text-ink-900">{formatFa(line.tax, 0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="flex items-start gap-1.5 text-[11px] leading-5 text-ink-400">
              <BadgeCheck className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              محاسبه بر اساس جدول مصوب سال {formatFa(PAYROLL_YEAR, 0)} است؛ ارقام هر سال
              تغییر می‌کند.
            </p>
          </div>
        ) : (
          <ResultHint>حقوق پایه را وارد کنید تا مالیات و پرداختی خالص محاسبه شود.</ResultHint>
        )}
      </ToolPanel>
    </div>
  );
}
