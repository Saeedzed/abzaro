"use client";

import { useMemo, useState } from "react";

import { PayrollYearTabs } from "@/components/tools/PayrollYearTabs";
import { CopyButton } from "@/components/tools/CopyButton";
import { todayJalali } from "@/lib/jalali";
import {
  DEFAULT_LATE_RATE,
  MONTHLY_HOURS,
  VAT_RATE,
  calculateHiringCost,
  calculateInsurance,
  calculateLatePayment,
  calculateLeavePay,
  calculateMahr,
  calculateMargin,
  calculateOvertime,
  calculateVat,
} from "@/lib/labour";
import { getPayrollYear, payrollYears } from "@/lib/payroll";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian";

const fa = (value: number | string) => toPersianDigits(String(value));
const money = (value: number) => fa(Math.round(value).toLocaleString("en-US"));
const num = (value: string) => Number(toEnglishDigits(value).replace(/[^\d.]/g, "")) || 0;

export type LabourKind =
  | "insurance"
  | "overtime"
  | "leave-pay"
  | "mahr"
  | "vat"
  | "profit-margin"
  | "hiring-cost"
  | "late-payment";

const TITLES: Record<LabourKind, string> = {
  insurance: "محاسبهٔ حق بیمهٔ تأمین اجتماعی",
  overtime: "محاسبهٔ اضافه‌کاری و شب‌کاری",
  "leave-pay": "محاسبهٔ حقوق مرخصی",
  mahr: "محاسبهٔ مهریه به سکه",
  vat: "مالیات بر ارزش افزوده",
  "profit-margin": "حاشیهٔ سود و نشانه‌گذاری",
  "hiring-cost": "هزینهٔ واقعی استخدام",
  "late-payment": "خسارت تأخیر تأدیه",
};

/** Tools whose numbers come from the annual wage decision. */
const YEAR_AWARE: LabourKind[] = ["insurance", "leave-pay", "hiring-cost"];

function Field({
  label,
  value,
  onChange,
  suffix,
  testid,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  testid: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
        {label}
        {suffix ? <span className="text-slate-400"> ({suffix})</span> : null}
      </span>
      <input
        data-testid={testid}
        value={value}
        inputMode="numeric"
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />
      {hint ? <span className="mt-1 block text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 ${strong ? "border-t border-slate-200 pt-2 dark:border-slate-700" : ""}`}>
      <dt className={`text-sm ${strong ? "font-bold text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"}`}>
        {label}
      </dt>
      <dd className={`text-sm ${strong ? "font-bold text-emerald-700 dark:text-emerald-400" : "font-semibold text-slate-900 dark:text-slate-200"}`}>
        {value}
      </dd>
    </div>
  );
}

export default function LabourCalculator({ kind }: { kind: LabourKind }) {
  const today = useMemo(() => todayJalali(), []);
  const [year, setYear] = useState<number>(
    payrollYears.includes(today.jy) ? today.jy : 1404,
  );

  // Inputs (kept as strings so Persian digits can be typed).
  const [salary, setSalary] = useState("20000000");
  const [hours, setHours] = useState("10");
  const [nightHours, setNightHours] = useState("0");
  const [days, setDays] = useState("5");
  const [usedSoFar, setUsedSoFar] = useState("0");
  const [nominal, setNominal] = useState("1000000000");
  const [coinPrice, setCoinPrice] = useState("50000000");
  const [goldGram, setGoldGram] = useState("0");
  const [amount, setAmount] = useState("1000000");
  const [mode, setMode] = useState<"add" | "extract">("add");
  const [cost, setCost] = useState("700000");
  const [price, setPrice] = useState("1000000");
  const [targetMargin, setTargetMargin] = useState("30");
  const [delayDays, setDelayDays] = useState("90");
  const [lateRate, setLateRate] = useState(String(DEFAULT_LATE_RATE * 100));

  function fillSample() {
    if (!window.confirm("مقادیر فعلی با مقادیر آزمایشی جایگزین شوند؟")) return;
    setSalary("20000000"); setHours("10"); setNightHours("0"); setDays("5");
    setUsedSoFar("0"); setNominal("1000000000"); setCoinPrice("50000000");
    setGoldGram("0"); setAmount("1000000"); setMode("add"); setCost("700000");
    setPrice("1000000"); setTargetMargin("30"); setDelayDays("90");
    setLateRate(String(DEFAULT_LATE_RATE * 100));
  }

  const data = getPayrollYear(year);

  const body = useMemo((): { rows: Array<[string, string]>; highlight: [string, string]; note: string } => {
    switch (kind) {
      case "insurance": {
        const result = calculateInsurance({ monthlySalary: num(salary), year });
        return {
          rows: [
            ["مبنای محاسبه", `${money(result.basis)} تومان`],
            ["سهم کارگر (۷٪) — از حقوق کم می‌شود", `${money(result.employeeShare)} تومان`],
            ["سهم کارفرما (۲۰٪ + ۳٪ بیکاری)", `${money(result.employerShare)} تومان`],
            ["جمع کل بیمه", `${money(result.total)} تومان`],
            ["هزینهٔ ماهانهٔ کارفرما (حقوق + سهم او)", `${money(result.employerCost)} تومان`],
          ] as Array<[string, string]>,
          highlight: ["جمع کل بیمه", `${money(result.total)} تومان`] as [string, string],
          note: result.usedMinimumWage
            ? `حقوق واردشده از حداقل مزد کمتر است، پس مبنای محاسبه حداقل مزد سال (${money(data.minMonthlyWage)} تومان) قرار گرفت — قانون همین را می‌گوید.`
            : "سهم کارگر ۷٪ و سهم کارفرما ۲۰٪ به‌علاوهٔ ۳٪ بیمهٔ بیکاری است.",
        };
      }
      case "overtime": {
        const result = calculateOvertime({
          monthlyWage: num(salary),
          overtimeHours: num(hours),
          nightHours: num(nightHours),
        });
        return {
          rows: [
            ["مزد ساعتی", `${money(result.hourlyRate)} تومان`],
            ["مزد ساعتی اضافه‌کاری (۱٫۴ برابر)", `${money(result.overtimeRate)} تومان`],
            ["مزد ساعتی شب‌کاری (۱٫۳۵ برابر)", `${money(result.nightRate)} تومان`],
            [`اضافه‌کاری ${fa(num(hours))} ساعت`, `${money(result.overtimePay)} تومان`],
            [`شب‌کاری ${fa(num(nightHours))} ساعت`, `${money(result.nightPay)} تومان`],
          ] as Array<[string, string]>,
          highlight: ["جمع اضافه‌کاری", `${money(result.total)} تومان`] as [string, string],
          note: `مبنای ساعتی = مزد ماهانه ÷ ${fa(MONTHLY_HOURS)} ساعت (۳۰ روز × ۷ ساعت و ۲۰ دقیقه).`,
        };
      }
      case "leave-pay": {
        const result = calculateLeavePay({
          monthlyWage: num(salary),
          usedDays: num(days),
          usedSoFar: num(usedSoFar),
          year,
        });
        return {
          rows: [
            ["مزد روزانه", `${money(result.dailyRate)} تومان`],
            [`حقوق ${fa(num(days))} روز مرخصی`, `${money(result.total)} تومان`],
            ["مرخصی استحقاقی سالانه", `${fa(result.entitledDays)} روز`],
            ["ماندهٔ مرخصی", `${fa(result.remainingDays)} روز`],
          ] as Array<[string, string]>,
          highlight: [`حقوق ${fa(num(days))} روز مرخصی`, `${money(result.total)} تومان`] as [string, string],
          note: `مزد روزانه = (حقوق + حق مسکن ${money(data.housingAllowance)} + بن ${money(data.foodAllowance)}) ÷ ۳۰.`,
        };
      }
      case "mahr": {
        const result = calculateMahr({
          nominal: num(nominal),
          coinPrice: num(coinPrice),
          goldGramPrice: num(goldGram) || undefined,
        });
        return {
          rows: [
            ["مبلغ مهریه", `${money(result.nominal)} تومان`],
            ["نرخ هر سکه", `${money(result.coinPrice)} تومان`],
            ...(num(goldGram) > 0
              ? ([["معادل طلا (گرم)", `${fa(result.inGoldGrams.grams)} گرم`]] as Array<[string, string]>)
              : []),
          ] as Array<[string, string]>,
          highlight: ["معادل سکهٔ تمام‌بهار", `${fa(result.coins)} سکه`] as [string, string],
          note: result.note,
        };
      }
      case "vat": {
        const result = calculateVat({ amount: num(amount), mode });
        return {
          rows: [
            ["مبلغ خالص", `${money(result.net)} تومان`],
            ["مالیات بر ارزش افزوده", `${money(result.vat)} تومان`],
            ["مبلغ ناخالص", `${money(result.gross)} تومان`],
          ] as Array<[string, string]>,
          highlight:
            mode === "add"
              ? ["مبلغ ناخالص", `${money(result.gross)} تومان`]
              : (["مالیات داخل مبلغ", `${money(result.includedVat)} تومان`] as [string, string]),
          note: `نرخ مصوب ${fa(Math.round(VAT_RATE * 100))}٪. ${result.note}`,
        };
      }
      case "profit-margin": {
        const result = calculateMargin({
          cost: num(cost),
          price: num(price),
          targetMarginPercent: num(targetMargin),
        });
        return {
          rows: [
            ["سود", `${money(result.profit)} تومان`],
            ["حاشیهٔ سود (از قیمت فروش)", `${fa(result.marginPercent)}٪`],
            ["نشانه‌گذاری (از قیمت تمام‌شده)", `${fa(result.markupPercent)}٪`],
            ...(result.priceForTargetMargin !== null
              ? ([["قیمت فروش برای حاشیهٔ هدف", `${money(result.priceForTargetMargin)} تومان`]] as Array<[string, string]>)
              : []),
          ] as Array<[string, string]>,
          highlight: ["سود", `${money(result.profit)} تومان`] as [string, string],
          note: result.note,
        };
      }
      case "hiring-cost": {
        const result = calculateHiringCost({ grossMonthly: num(salary), year });
        return {
          rows: [
            ["حقوق ناخالص ماهانه", `${money(result.grossMonthly)} تومان`],
            ["سهم بیمهٔ کارگر (از حقوق کم می‌شود)", `${money(result.employeeInsurance)} تومان`],
            ["دریافتی خالص کارمند", `${money(result.netToEmployee)} تومان`],
            ["سهم بیمهٔ کارفرما", `${money(result.employerInsurance)} تومان`],
            ["هزینهٔ ماهانهٔ شرکت", `${money(result.employerMonthlyCost)} تومان`],
            ["عیدی سالانه", `${money(result.eidi)} تومان`],
            ["ذخیرهٔ سنوات", `${money(result.severancePerYear)} تومان`],
          ] as Array<[string, string]>,
          highlight: ["هزینهٔ سالانهٔ شرکت", `${money(result.employerYearlyCost)} تومان`] as [string, string],
          note: result.note,
        };
      }
      case "late-payment": {
        const result = calculateLatePayment({
          principal: num(amount),
          days: num(delayDays),
          annualRate: num(lateRate) / 100,
        });
        return {
          rows: [
            ["اصل بدهی", `${money(result.principal)} تومان`],
            ["تعداد روز تأخیر", `${fa(result.days)} روز`],
            ["نرخ سالانهٔ به‌کاررفته", `${fa(Math.round(result.annualRate * 100))}٪`],
            ["خسارت تأخیر", `${money(result.penalty)} تومان`],
          ] as Array<[string, string]>,
          highlight: ["جمع اصل و خسارت", `${money(result.total)} تومان`] as [string, string],
          note: result.note,
        };
      }
    }
  }, [
    kind, year, data, salary, hours, nightHours, days, usedSoFar, nominal,
    coinPrice, goldGram, amount, mode, cost, price, targetMargin, delayDays, lateRate,
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{TITLES[kind]}</h3>
        <button type="button" onClick={fillSample} data-testid="labour-sample" className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-brand-300 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">درج مقادیر نمونه</button>

        {YEAR_AWARE.includes(kind) ? (
          <div className="mt-4">
            <PayrollYearTabs value={year} onChange={setYear} />
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(kind === "insurance" || kind === "overtime" || kind === "leave-pay" || kind === "hiring-cost") && (
            <Field
              label={kind === "leave-pay" ? "حقوق ماهانه" : kind === "hiring-cost" ? "حقوق و مزایای ناخالص" : "حقوق ماهانه"}
              suffix="تومان"
              value={salary}
              onChange={setSalary}
              testid="labour-salary"
            />
          )}

          {kind === "overtime" && (
            <>
              <Field label="ساعت اضافه‌کاری" suffix="ساعت" value={hours} onChange={setHours} testid="labour-hours" />
              <Field label="ساعت شب‌کاری (۲۲ تا ۶)" suffix="ساعت" value={nightHours} onChange={setNightHours} testid="labour-night" />
            </>
          )}

          {kind === "leave-pay" && (
            <>
              <Field label="روزهای مرخصی" suffix="روز" value={days} onChange={setDays} testid="labour-days" />
              <Field
                label="مرخصی استفاده‌شده تا امروز"
                suffix="روز"
                value={usedSoFar}
                onChange={setUsedSoFar}
                testid="labour-used"
                hint="برای محاسبهٔ ماندهٔ مرخصی"
              />
            </>
          )}

          {kind === "mahr" && (
            <>
              <Field label="مبلغ مهریه" suffix="تومان" value={nominal} onChange={setNominal} testid="labour-nominal" />
              <Field
                label="نرخ هر سکهٔ تمام‌بهار"
                suffix="تومان"
                value={coinPrice}
                onChange={setCoinPrice}
                testid="labour-coin"
                hint="نرخ روز را خودتان وارد کنید"
              />
              <Field
                label="نرخ هر گرم طلا (اختیاری)"
                suffix="تومان"
                value={goldGram}
                onChange={setGoldGram}
                testid="labour-gold"
              />
            </>
          )}

          {(kind === "vat" || kind === "late-payment") && (
            <Field
              label={kind === "vat" ? "مبلغ" : "اصل بدهی"}
              suffix="تومان"
              value={amount}
              onChange={setAmount}
              testid="labour-amount"
            />
          )}

          {kind === "vat" && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">نوع محاسبه</span>
              <select
                data-testid="labour-vat-mode"
                value={mode}
                onChange={(event) => setMode(event.target.value as typeof mode)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="add">افزودن مالیات به مبلغ</option>
                <option value="extract">جدا کردن مالیات از مبلغ</option>
              </select>
            </label>
          )}

          {kind === "profit-margin" && (
            <>
              <Field label="قیمت تمام‌شده" suffix="تومان" value={cost} onChange={setCost} testid="labour-cost" />
              <Field label="قیمت فروش" suffix="تومان" value={price} onChange={setPrice} testid="labour-price" />
              <Field label="حاشیهٔ سود هدف" suffix="٪" value={targetMargin} onChange={setTargetMargin} testid="labour-target" />
            </>
          )}

          {kind === "late-payment" && (
            <>
              <Field label="روزهای تأخیر" suffix="روز" value={delayDays} onChange={setDelayDays} testid="labour-delay-days" />
              <Field
                label="نرخ تورم سالانه"
                suffix="٪"
                value={lateRate}
                onChange={setLateRate}
                testid="labour-late-rate"
                hint="پیش‌فرض ۱۸٪ است؛ در پرونده‌های مختلف متفاوت است"
              />
            </>
          )}
        </div>
      </section>

      <section
        data-testid="labour-result"
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30"
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">نتیجه</h3>
          <CopyButton value={body.highlight[1]} label="کپی" />
        </div>
        <dl className="divide-y divide-emerald-100 dark:divide-emerald-900/40">
          {body.rows.map(([label, value]) => (
            <Row key={label} label={label} value={value} />
          ))}
        </dl>
        <div data-testid="labour-highlight" className="mt-3">
          <Row label={body.highlight[0]} value={body.highlight[1]} strong />
        </div>
        <p data-testid="labour-note" className="mt-3 text-xs leading-6 text-slate-600 dark:text-slate-400">
          {body.note}
        </p>
      </section>
    </div>
  );
}
