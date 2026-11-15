"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getPayrollYear, payrollYears } from "@/lib/payroll";
import { formatFa } from "./shared";

/**
 * Year selector for the salary/tax calculators.
 *
 * ۱۴۰۴ is the verified default; ۱۴۰۵ is shown but explicitly labelled as «در حال
 * بازبینی» until the insurance ceiling (۷× daily wage) is confirmed from a second
 * source. Showing the number without that badge would be the exact mistake we
 * criticise in the competitor's build.
 */
export function PayrollYearTabs({
  value,
  onChange,
}: {
  value: number;
  onChange: (year: number) => void;
}) {
  const data = getPayrollYear(value);

  return (
    <div data-testid="payroll-year-tabs">
      <div
        role="tablist"
        aria-label="سال مالیاتی"
        className="flex gap-2 rounded-2xl border border-ink-200 bg-white p-1.5 shadow-card"
      >
        {payrollYears.map((year) => (
          <button
            key={year}
            type="button"
            role="tab"
            aria-selected={value === year}
            onClick={() => onChange(year)}
            data-testid={`year-tab-${year}`}
            className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition ${
              value === year ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-100"
            }`}
          >
            {formatFa(year, 0)}
            {!getPayrollYear(year).verified && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                  value === year ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                }`}
              >
                بازبینی
              </span>
            )}
          </button>
        ))}
      </div>

      <p
        className={`mt-2 flex items-start gap-1.5 rounded-xl px-3 py-2 text-[11px] leading-5 ${
          data.verified ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
        }`}
        data-testid="payroll-year-note"
      >
        {data.verified ? (
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        )}
        {data.note}
      </p>
    </div>
  );
}
