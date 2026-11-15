/**
 * Labour and finance calculators (گروه B3).
 *
 * Every rate that comes from law or from the annual wage decision is taken from
 * `getPayrollYear(year)` — never typed in here — so the 1404/1405 selector works
 * for all eight tools and there is exactly one place to correct if a number is
 * revised.
 *
 * Rules that are *not* published as a single number (severance for resignation,
 * delay-of-payment interest) are computed from an explicit formula that the UI
 * states next to the result.
 */

import {
  EMPLOYEE_INSURANCE_RATE,
  getPayrollYear,
  type PayrollYearData,
} from "@/lib/payroll";

/** Currency helper: everything in this module is in Toman. */
export type Toman = number;

const r = (value: number) => Math.round(value);

// ────────────────────────────────────────────────────────── 1. insurance

export interface InsuranceResult {
  /** مبلغ کل حق بیمه (سهم کارگر + کارفرما). */
  total: Toman;
  employeeShare: Toman;
  employerShare: Toman;
  /** مبلغی که از حقوق کارگر کم می‌شود. */
  deductedFromSalary: Toman;
  /** سهم کارفرما که به هزینهٔ شرکت اضافه می‌شود. */
  employerCost: Toman;
  /** مبنای محاسبه (حداقل یا حقوق واقعی). */
  basis: Toman;
  usedMinimumWage: boolean;
  rate: { employee: number; employer: number };
  note: string;
}

/**
 * سهم بیمهٔ تأمین اجتماعی.
 *
 * سهم کارگر ۷٪ است و سهم کارفرما ۲۰٪ (به‌علاوهٔ ۳٪ بیمهٔ بیکاری که در بسیاری از
 * جدول‌ها جدا نوشته می‌شود). اگر حقوق کمتر از حداقل مزد باشد، مبنای محاسبه
 * حداقل مزد است — قانون همین را می‌گوید، پس همان را اعمال می‌کنیم و اعلام می‌کنیم.
 */
export const EMPLOYER_INSURANCE_RATE = 0.2;
export const UNEMPLOYMENT_RATE = 0.03;

export function calculateInsurance(input: {
  monthlySalary: Toman;
  year?: number;
  /** آیا بیمهٔ بیکاری هم حساب شود (پیش‌فرض: بله). */
  includeUnemployment?: boolean;
}): InsuranceResult {
  const data = getPayrollYear(input.year ?? 1404);
  const includeUnemployment = input.includeUnemployment ?? true;
  const salary = Math.max(0, input.monthlySalary);
  const basis = Math.max(salary, data.minMonthlyWage);
  const employerRate = EMPLOYER_INSURANCE_RATE + (includeUnemployment ? UNEMPLOYMENT_RATE : 0);

  const employeeShare = r(basis * EMPLOYEE_INSURANCE_RATE);
  const employerShare = r(basis * employerRate);

  return {
    total: employeeShare + employerShare,
    employeeShare,
    employerShare,
    deductedFromSalary: employeeShare,
    employerCost: basis + employerShare,
    basis,
    usedMinimumWage: salary < data.minMonthlyWage,
    rate: { employee: EMPLOYEE_INSURANCE_RATE, employer: employerRate },
    note: data.verified ? data.note : data.note,
  };
}

// ──────────────────────────────────────────────────────── 2. overtime

export interface OvertimeResult {
  /** مزد ساعتی عادی. */
  hourlyRate: Toman;
  /** مزد ساعتی اضافه‌کاری (۱٫۴ برابر). */
  overtimeRate: Toman;
  /** مزد ساعتی تعطیل کاری (۱٫۴ برابر) و شب‌کاری (۱٫۳۵ + ۳۵٪). */
  holidayRate: Toman;
  nightRate: Toman;
  overtimePay: Toman;
  holidayPay: Toman;
  nightPay: Toman;
  total: Toman;
  note: string;
}

/**
 * اضافه‌کاری و شب‌کاری.
 *
 * مادهٔ ۵۹ قانون کار: اضافه‌کاری ۴۰٪ بیشتر از مزد عادی. مادهٔ ۵۸: کار در شب
 * (۲۲ تا ۶) ۳۵٪ فوق‌العاده. کار در روز تعطیل (جمعه/تعطیل رسمی) = مزد روز + ۴۰٪.
 * ساعتی‌شدن مزد: مزد ماهانه ÷ ۲۲۰ ساعت (۳۰ روز × ۷ ساعت و ۲۰ دقیقه) — همان
 * مخرجی که جدول‌های رسمی استفاده می‌کنند.
 */
export const MONTHLY_HOURS = 220;
export const OVERTIME_MULTIPLIER = 1.4;
export const NIGHT_PREMIUM = 0.35;

export function calculateOvertime(input: {
  monthlyWage: Toman;
  overtimeHours: number;
  holidayHours?: number;
  nightHours?: number;
  monthlyHours?: number;
}): OvertimeResult {
  const monthlyHours = input.monthlyHours ?? MONTHLY_HOURS;
  const hourlyRate = monthlyHours > 0 ? input.monthlyWage / monthlyHours : 0;
  const overtimeRate = hourlyRate * OVERTIME_MULTIPLIER;
  const holidayRate = hourlyRate * OVERTIME_MULTIPLIER;
  const nightRate = hourlyRate * (1 + NIGHT_PREMIUM);

  const overtimePay = r(overtimeRate * Math.max(0, input.overtimeHours));
  const holidayPay = r(holidayRate * Math.max(0, input.holidayHours ?? 0));
  const nightPay = r(nightRate * Math.max(0, input.nightHours ?? 0));

  return {
    hourlyRate: r(hourlyRate),
    overtimeRate: r(overtimeRate),
    holidayRate: r(holidayRate),
    nightRate: r(nightRate),
    overtimePay,
    holidayPay,
    nightPay,
    total: overtimePay + holidayPay + nightPay,
    note: `مبنای ساعتی: مزد ماهانه ÷ ${monthlyHours} ساعت.`,
  };
}

// ──────────────────────────────────────────────────────── 3. leave pay

export interface LeaveResult {
  /** مزد روزانه. */
  dailyRate: Toman;
  /** مزد هر روز مرخصی (با حق مسکن و بن، طبق مادهٔ ۶۴). */
  leaveDayRate: Toman;
  /** مبلغ کل مرخصی. */
  total: Toman;
  /** ماندهٔ مرخصی بعد از استفاده. */
  remainingDays: number;
  /** حداکثر مرخصی سالانه طبق قانون. */
  entitledDays: number;
  note: string;
}

/**
 * حقوق مرخصی.
 *
 * مادهٔ ۶۲: ۳۰ روز مرخصی استحقاقی در سال (۲۶ روز + ۴ جمعه). مادهٔ ۶۴: مزد
 * روزهای مرخصی با مزد روزانهٔ عادی پرداخت می‌شود؛ مزد روزانه = (حقوق ماهانه +
 * حق مسکن + بن) ÷ ۳۰.
 */
export const ANNUAL_LEAVE_DAYS = 30;

export function calculateLeavePay(input: {
  monthlyWage: Toman;
  usedDays: number;
  year?: number;
  /** روزهای مرخصی استفاده‌شده تا امروز، برای محاسبهٔ مانده. */
  usedSoFar?: number;
}): LeaveResult {
  const data = getPayrollYear(input.year ?? 1404);
  const monthlyBase = input.monthlyWage + data.housingAllowance + data.foodAllowance;
  const dailyRate = monthlyBase / 30;
  const used = Math.max(0, input.usedDays);

  return {
    dailyRate: r(dailyRate),
    leaveDayRate: r(dailyRate),
    total: r(dailyRate * used),
    remainingDays: Math.max(0, ANNUAL_LEAVE_DAYS - (input.usedSoFar ?? used)),
    entitledDays: ANNUAL_LEAVE_DAYS,
    note: "مزد روزانه = (حقوق + حق مسکن + بن) ÷ ۳۰.",
  };
}

// ───────────────────────────────────────────────────────── 4. mahr (مهریه)

export interface MahrResult {
  /** مبلغ اسمی مهریه (تومان). */
  nominal: Toman;
  /** همان مبلغ به سکهٔ تمام‌بهار آزادی. */
  coins: number;
  /** ارزش یک سکه بر اساس نرخی که کاربر وارد کرده. */
  coinPrice: Toman;
  /** شاخص‌های جایگزین. */
  inGoldGrams: { grams: number; goldPrice: number };
  note: string;
}

/**
 * تبدیل مهریه به سکه.
 *
 * مهریه در سند رسمی یا «وجه نقد» است یا «سکهٔ تمام‌بهار آزادی». تبدیل به سکه
 * بدون نرخ روز ممکن نیست، پس نرخ را از کاربر می‌گیریم و روی آن محاسبه می‌کنیم —
 * هیچ نرخی را حدس نمی‌زنیم.
 */
export function calculateMahr(input: {
  nominal: Toman;
  coinPrice: Toman;
  goldGramPrice?: Toman;
}): MahrResult {
  const coins = input.coinPrice > 0 ? input.nominal / input.coinPrice : 0;
  const gramPrice = input.goldGramPrice ?? 0;
  return {
    nominal: input.nominal,
    coins: Math.round(coins * 100) / 100,
    coinPrice: input.coinPrice,
    inGoldGrams: {
      grams: gramPrice > 0 ? Math.round((input.nominal / gramPrice) * 10) / 10 : 0,
      goldPrice: gramPrice,
    },
    note: "محاسبه بر اساس نرخ سکهٔ واردشده توسط شما؛ نرخ بازار لحظه‌ای توسط این ابزار استعلام نمی‌شود.",
  };
}

// ────────────────────────────────────────────────────────── 5. VAT

export interface VatResult {
  net: Toman;
  vat: Toman;
  gross: Toman;
  rate: number;
  /** VAT extracted from a tax-inclusive amount. */
  includedVat: Toman;
  note: string;
}

/**
 * مالیات بر ارزش افزوده.
 *
 * نرخ قانونی ۱۰٪ است (قانون مالیات بر ارزش افزوده، از ۱۴۰۰). محاسبه در دو جهت:
 * افزودن به مبلغ خالص، یا جدا کردن از مبلغ ناخالص (محاسبهٔ معکوس).
 */
export const VAT_RATE = 0.1;

export function calculateVat(input: {
  amount: Toman;
  mode: "add" | "extract";
  rate?: number;
}): VatResult {
  const rate = input.rate ?? VAT_RATE;
  const amount = Math.max(0, input.amount);

  if (input.mode === "add") {
    const vat = r(amount * rate);
    return {
      net: r(amount),
      vat,
      gross: r(amount) + vat,
      rate,
      includedVat: 0,
      note: "مالیات = مبلغ × نرخ مصوب (پیش‌فرض ۱۰٪)",
    };
  }

  const net = r(amount / (1 + rate));
  return {
    net,
    vat: r(amount) - net,
    gross: r(amount),
    rate,
    includedVat: r(amount) - net,
    note: "مالیات داخل مبلغ = ناخالص − ناخالص ÷ (۱ + نرخ)",
  };
}

// ─────────────────────────────────────────────────────── 6. profit margin

export interface MarginResult {
  profit: Toman;
  /** حاشیهٔ سود = سود ÷ قیمت فروش. */
  marginPercent: number;
  /** نشانه‌گذاری = سود ÷ قیمت تمام‌شده. */
  markupPercent: number;
  cost: Toman;
  price: Toman;
  /** قیمت فروش لازم برای رسیدن به حاشیهٔ هدف. */
  priceForTargetMargin: Toman | null;
  note: string;
}

/**
 * حاشیهٔ سود و نشانه‌گذاری.
 *
 * این دو عدد با هم اشتباه گرفته می‌شوند: حاشیه بر مبنای *قیمت فروش* است و
 * نشانه‌گذاری بر مبنای *قیمت تمام‌شده*. تفاوت را در خروجی صریح نوشته‌ایم.
 */
export function calculateMargin(input: {
  cost: Toman;
  price: Toman;
  targetMarginPercent?: number;
}): MarginResult {
  const cost = Math.max(0, input.cost);
  const price = Math.max(0, input.price);
  const profit = price - cost;
  const marginPercent = price > 0 ? (profit / price) * 100 : 0;
  const markupPercent = cost > 0 ? (profit / cost) * 100 : 0;
  const target = input.targetMarginPercent;

  return {
    profit: r(profit),
    marginPercent: Math.round(marginPercent * 10) / 10,
    markupPercent: Math.round(markupPercent * 10) / 10,
    cost: r(cost),
    price: r(price),
    priceForTargetMargin:
      target !== undefined && target < 100 ? r(cost / (1 - target / 100)) : null,
    note: "حاشیه = سود ÷ قیمت فروش؛ نشانه‌گذاری = سود ÷ قیمت تمام‌شده.",
  };
}

// ─────────────────────────────────────────────────────── 7. hiring cost

export interface HiringCostResult {
  /** حقوق و مزایای ناخالص ماهانه. */
  grossMonthly: Toman;
  employeeInsurance: Toman;
  employerInsurance: Toman;
  netToEmployee: Toman;
  /** هزینهٔ واقعی شرکت در ماه. */
  employerMonthlyCost: Toman;
  /** هزینهٔ سالانه با احتساب عیدی و سنوات. */
  employerYearlyCost: Toman;
  /** عیدی تخمینی (۲ ماه حقوق، سقف قانونی). */
  eidi: Toman;
  /** سنوات تخمینی (یک ماه حقوق به ازای هر سال). */
  severancePerYear: Toman;
  note: string;
}

/**
 * هزینهٔ واقعی استخدام.
 *
 * عددی که کارفرما باید بودجه بگیرد: حقوق ناخالص + سهم بیمهٔ کارفرما + عیدی +
 * ذخیرهٔ سنوات. عیدی طبق مادهٔ ۲۴ تا سقف ۳ برابر حداقل مزد (۲ ماه حقوق) و
 * سنوات یک ماه حقوق به ازای هر سال کار است.
 */
export function calculateHiringCost(input: {
  grossMonthly: Toman;
  year?: number;
  monthsPerYear?: number;
}): HiringCostResult {
  const data: PayrollYearData = getPayrollYear(input.year ?? 1404);
  const months = input.monthsPerYear ?? 12;
  const gross = Math.max(0, input.grossMonthly);

  const employeeInsurance = r(gross * data.employeeInsuranceRate);
  const employerInsurance = r(gross * (EMPLOYER_INSURANCE_RATE + UNEMPLOYMENT_RATE));
  // عیدی: دو ماه حقوق، با سقف ۳ برابر حداقل مزد ماهانه.
  const eidi = Math.min(r(gross * 2), data.minMonthlyWage * 3);
  const severancePerYear = r(gross);

  return {
    grossMonthly: r(gross),
    employeeInsurance,
    employerInsurance,
    netToEmployee: r(gross - employeeInsurance),
    employerMonthlyCost: r(gross + employerInsurance),
    employerYearlyCost: r(gross + employerInsurance) * months + eidi + severancePerYear,
    eidi,
    severancePerYear,
    note: "سقف عیدی ۳ برابر حداقل مزد ماهانه است (مادهٔ ۲۴ قانون کار).",
  };
}

// ─────────────────────────────────────────────────── 8. late payment

export interface LatePaymentResult {
  principal: Toman;
  days: number;
  /** نرخ سالانهٔ استفاده‌شده. */
  annualRate: number;
  /** مبلغ تأخیر تأدیه. */
  penalty: Toman;
  total: Toman;
  note: string;
}

/**
 * خسارت تأخیر تأدیه.
 *
 * طبق مادهٔ ۵۲۲ قانون آیین دادرسی مدنی، خسارت تأخیر بر مبنای نرخ تورم (شاخص
 * بانک مرکزی) محاسبه می‌شود و نرخ ثابتی در قانون ندارد. پس نرخ را از کاربر
 * می‌گیریم، پیش‌فرض ۱۸٪ (میانگین رایج اصلاحات قضایی) را *پیشنهاد* می‌دهیم و در
 * خروجی می‌نویسیم که نرخ قابل تغییر و موردی است.
 */
export const DEFAULT_LATE_RATE = 0.18;

export function calculateLatePayment(input: {
  principal: Toman;
  days: number;
  annualRate?: number;
}): LatePaymentResult {
  const annualRate = input.annualRate ?? DEFAULT_LATE_RATE;
  const principal = Math.max(0, input.principal);
  const days = Math.max(0, input.days);
  const penalty = r(principal * annualRate * (days / 365));

  return {
    principal: r(principal),
    days,
    annualRate,
    penalty,
    total: r(principal) + penalty,
    note: "نرخ تورم سالانه است و در پرونده‌های مختلف متفاوت است؛ نرخ را با نظر کارشناس یا دادگاه تنظیم کنید.",
  };
}
