/**
 * Iranian payroll maths: income tax on salary (مالیات بر حقوق), عیدی and
 * سنوات. Pure functions → unit-tested in payroll.test.ts.
 *
 * The numbers are the ones published for **سال ۱۴۰۴** (قانون بودجه ۱۴۰۴ +
 * مصوبهٔ شورای عالی کار). They change every year, so `PAYROLL_YEAR` is
 * surfaced in the UI and the table lives in ONE place here.
 */

export const PAYROLL_YEAR = 1404;

/**
 * حداقل حقوق ماهانهٔ مصوب شورای عالی کار برای سال ۱۴۰۴.
 * مصوبه ۱۰۳٬۹۰۹٬۶۸۰ **ریال** است = ۱۰٬۳۹۰٬۹۶۸ تومان.
 */
export const MIN_MONTHLY_WAGE_1404 = 10_390_968;

/** حق مسکن ۱۴۰۴ (۹۰۰٬۰۰۰ تومان در ماه، معاف از مالیات). */
export const HOUSING_ALLOWANCE_1404 = 900_000;

/** سقف معافیت ماهانهٔ مالیات حقوق ۱۴۰۴ (تومان). */
export const MONTHLY_TAX_EXEMPTION_1404 = 24_000_000;

export interface TaxBracket {
  /** سقف این پله به تومان (ماهانه). Infinity برای آخرین پله. */
  upTo: number;
  /** نرخ مالیات روی مازاد پلهٔ قبل تا این سقف. */
  rate: number;
}

/**
 * پله‌های مالیات بر حقوق ۱۴۰۴ — روی حقوق «مشمول مالیات» (بعد از کسر بیمه).
 * تا ۲۴ میلیون معاف، سپس ۱۰٪ / ۱۵٪ / ۲۰٪ / ۲۵٪ / ۳۰٪.
 */
export const TAX_BRACKETS_1404: TaxBracket[] = [
  { upTo: 24_000_000, rate: 0 },
  { upTo: 30_000_000, rate: 0.1 },
  { upTo: 38_000_000, rate: 0.15 },
  { upTo: 50_000_000, rate: 0.2 },
  { upTo: 66_600_000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

/**
 * نسخهٔ کامل دادهٔ هر سال.
 *
 * `verified` یعنی دست‌کم دو منبع مستقل عدد را تأیید کرده‌اند. تا وقتی `false`
 * است، ابزار عدد را نشان می‌دهد ولی برچسب «در حال بازبینی» هم می‌گذارد —
 * ادعای قطعیت دربارهٔ عدد بازبینی‌نشده، همان اشتباهی است که رقیب کرده.
 */
export interface PayrollYearData {
  year: number;
  /** حداقل حقوق ماهانهٔ مصوب شورای عالی کار (تومان). */
  minMonthlyWage: number;
  /** حق مسکن ماهانه (تومان). */
  housingAllowance: number;
  /** حق بن و خواروبار ماهانه (تومان). */
  foodAllowance: number;
  /** حق تأهل ماهانه (تومان). */
  marriageAllowance: number;
  /** حق اولاد به‌ازای هر فرزند (تومان). */
  childAllowance: number;
  /** سقف معافیت مالیات ماهانه (تومان). */
  monthlyTaxExemption: number;
  /** سقف معافیت سالانه (تومان). */
  yearlyTaxExemption: number;
  /** پله‌های مالیات ماهانه. */
  brackets: TaxBracket[];
  /** نرخ بیمهٔ سهم کارگر. */
  employeeInsuranceRate: number;
  /** آیا داده‌ها با دو منبع مستقل تأیید شده‌اند. */
  verified: boolean;
  /** توضیح کوتاه منبع/وضعیت برای نمایش در UI. */
  note: string;
}

const BRACKETS_1404: TaxBracket[] = [
  { upTo: 24_000_000, rate: 0 },
  { upTo: 30_000_000, rate: 0.1 },
  { upTo: 38_000_000, rate: 0.15 },
  { upTo: 50_000_000, rate: 0.2 },
  { upTo: 66_600_000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

/**
 * پله‌های ۱۴۰۵. با معافیت ۴۰ میلیون تومانی، پله‌ها به همان ترتیب ۱۰/۱۵/۲۰/۲۵/۳۰
 * درصد روی مازاد هر پله اعمال می‌شوند (مصوبهٔ بودجهٔ ۱۴۰۵).
 */
const BRACKETS_1405: TaxBracket[] = [
  { upTo: 40_000_000, rate: 0 },
  { upTo: 50_000_000, rate: 0.1 },
  { upTo: 62_000_000, rate: 0.15 },
  { upTo: 78_000_000, rate: 0.2 },
  { upTo: 100_000_000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

export const PAYROLL_DATA: Record<number, PayrollYearData> = {
  1404: {
    year: 1404,
    minMonthlyWage: MIN_MONTHLY_WAGE_1404,
    housingAllowance: HOUSING_ALLOWANCE_1404,
    foodAllowance: 1_400_000,
    marriageAllowance: 500_000,
    childAllowance: 1_039_097,
    monthlyTaxExemption: MONTHLY_TAX_EXEMPTION_1404,
    yearlyTaxExemption: 288_000_000,
    brackets: BRACKETS_1404,
    employeeInsuranceRate: 0.07,
    verified: true,
    note: "دادهٔ رسمی سال ۱۴۰۴ — پیش‌فرض همهٔ محاسبات.",
  },
  1405: {
    year: 1405,
    minMonthlyWage: 16_625_550,
    housingAllowance: 3_000_000,
    foodAllowance: 2_200_000,
    marriageAllowance: 500_000,
    childAllowance: 1_662_555,
    monthlyTaxExemption: 40_000_000,
    yearlyTaxExemption: 480_000_000,
    brackets: BRACKETS_1405,
    employeeInsuranceRate: 0.07,
    verified: false,
    note:
      "دادهٔ ۱۴۰۵ از مصوبهٔ بودجه و مصوبهٔ شورای عالی کار گرفته شده و در حال بازبینی نهایی است؛ سقف بیمه (۷ برابر مزد روزانه) هنوز تأیید نشده.",
  },
};

export const payrollYears = Object.keys(PAYROLL_DATA).map(Number).sort((a, b) => a - b);

export function getPayrollYear(year: number): PayrollYearData {
  return PAYROLL_DATA[year] ?? PAYROLL_DATA[PAYROLL_YEAR]!;
}

/** نرخ بیمهٔ سهم کارگر (۷٪ از حقوق و مزایای مشمول). */
export const EMPLOYEE_INSURANCE_RATE = 0.07;

export interface TaxLine {
  /** عنوان پله برای نمایش. */
  label: string;
  /** مبلغی که در این پله قرار گرفته. */
  amount: number;
  /** نرخ پله. */
  rate: number;
  /** مالیات این پله. */
  tax: number;
}

export interface SalaryTaxResult {
  /** حقوق مشمول مالیات (بعد از کسر بیمه). */
  taxable: number;
  /** مجموع مالیات ماهانه. */
  tax: number;
  /** نرخ مؤثر (مالیات ÷ مشمول). */
  effectiveRate: number;
  /** تفکیک پله‌ها. */
  lines: TaxLine[];
}

/**
 * مالیات پلکانی حقوق. `taxable` مبلغ ماهانهٔ مشمول مالیات است
 * (یعنی حقوق ناخالص منهای بیمهٔ سهم کارگر و منهای مزایای معاف).
 */
export function calculateSalaryTax(
  taxable: number,
  brackets: TaxBracket[] = TAX_BRACKETS_1404,
): SalaryTaxResult {
  const safe = Number.isFinite(taxable) && taxable > 0 ? taxable : 0;
  const lines: TaxLine[] = [];
  let lower = 0;
  let total = 0;

  for (const bracket of brackets) {
    if (safe <= lower) break;
    const slice = Math.min(safe, bracket.upTo) - lower;
    if (slice <= 0) {
      lower = bracket.upTo;
      continue;
    }
    const tax = slice * bracket.rate;
    total += tax;
    lines.push({
      label:
        bracket.upTo === Infinity
          ? `مازاد ${formatBracket(lower)}`
          : `${formatBracket(lower)} تا ${formatBracket(bracket.upTo)}`,
      amount: slice,
      rate: bracket.rate,
      tax,
    });
    lower = bracket.upTo;
  }

  return {
    taxable: safe,
    tax: Math.round(total),
    effectiveRate: safe > 0 ? total / safe : 0,
    lines,
  };
}

function formatBracket(value: number): string {
  return `${Math.round(value / 1_000_000)} میلیون`;
}

export interface SalaryBreakdown {
  /** حقوق پایه + مزایای مشمول. */
  gross: number;
  /** بیمهٔ سهم کارگر. */
  insurance: number;
  /** حقوق مشمول مالیات. */
  taxable: number;
  /** مالیات ماهانه. */
  tax: number;
  /** پرداختی خالص. */
  net: number;
  /** تفکیک پله‌ها. */
  lines: TaxLine[];
  /** نرخ مؤثر مالیات. */
  effectiveRate: number;
}

/**
 * محاسبهٔ کامل فیش حقوقی ماهانه.
 * `taxableExtras` مزایای مشمول مالیات (حق اولاد، اضافه‌کاری…) و
 * `exemptExtras` مزایای معاف (حق مسکن، بن) هستند.
 */
export function calculateSalary(input: {
  baseSalary: number;
  taxableExtras?: number;
  exemptExtras?: number;
  insuranceRate?: number;
  /** سال مالیاتی؛ پله‌ها و نرخ‌ها از همین سال خوانده می‌شوند (پیش‌فرض ۱۴۰۴). */
  year?: number;
}): SalaryBreakdown | null {
  const base = input.baseSalary;
  if (!Number.isFinite(base) || base <= 0) return null;

  const taxableExtras = Math.max(0, input.taxableExtras ?? 0);
  const exemptExtras = Math.max(0, input.exemptExtras ?? 0);
  const data = getPayrollYear(input.year ?? PAYROLL_YEAR);
  const rate = clamp(input.insuranceRate ?? data.employeeInsuranceRate, 0, 0.3);

  const gross = base + taxableExtras;
  const insurance = Math.round(gross * rate);
  const taxable = Math.max(0, gross - insurance);
  const { tax, lines, effectiveRate } = calculateSalaryTax(taxable, data.brackets);

  return {
    gross,
    insurance,
    taxable,
    tax,
    net: Math.round(gross - insurance - tax + exemptExtras),
    lines,
    effectiveRate,
  };
}

export interface EidiResult {
  /** عیدی محاسبه‌شده (پیش از مالیات). */
  amount: number;
  /** کف قانونی بر اساس ماه‌های کارکرد. */
  floor: number;
  /** سقف قانونی. */
  ceiling: number;
  /** آیا سقف اعمال شد. */
  cappedAtCeiling: boolean;
  /** مالیات عیدی. */
  tax: number;
  /** عیدی خالص. */
  net: number;
}

/**
 * عیدی پایان سال بر اساس قانون کار:
 *   معادل دو ماه مزد، به نسبت ماه‌های کارکرد، بین ۲ و ۳ برابر حداقل مزد ماهانه.
 * مالیات: مازاد بر سقف معافیت ماهانه با نرخ ۱۰٪.
 */
export function calculateEidi(input: {
  monthlyWage: number;
  monthsWorked: number;
  /** حداقل مزد ماهانهٔ سال (پیش‌فرض: سال انتخاب‌شده). */
  minMonthlyWage?: number;
  /** سال مالیاتی. */
  year?: number;
}): EidiResult | null {
  const wage = input.monthlyWage;
  const months = input.monthsWorked;
  if (!Number.isFinite(wage) || wage <= 0) return null;
  if (!Number.isFinite(months) || months <= 0) return null;

  const data = getPayrollYear(input.year ?? PAYROLL_YEAR);
  const minWage = input.minMonthlyWage ?? data.minMonthlyWage;
  const ratio = clamp(months, 0, 12) / 12;

  const raw = wage * 2 * ratio;
  const floor = minWage * 2 * ratio;
  const ceiling = minWage * 3;

  const capped = Math.min(Math.max(raw, floor), ceiling);
  const tax = Math.max(0, capped - data.monthlyTaxExemption) * 0.1;

  return {
    amount: Math.round(capped),
    floor: Math.round(floor),
    ceiling: Math.round(ceiling),
    cappedAtCeiling: raw > ceiling,
    tax: Math.round(tax),
    net: Math.round(capped - tax),
  };
}

/**
 * سنوات (پاداش پایان خدمت): یک ماه مزد برای هر سال کامل خدمت.
 * `monthsWorked` اجازه می‌دهد سنوات ناقص هم حساب شود.
 */
export function calculateSanavat(input: {
  monthlyWage: number;
  years: number;
}): number | null {
  const wage = input.monthlyWage;
  const years = input.years;
  if (!Number.isFinite(wage) || wage <= 0) return null;
  if (!Number.isFinite(years) || years < 0) return null;
  return Math.round((wage / 12) * (years * 12));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
