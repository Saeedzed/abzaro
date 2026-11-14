/**
 * Loan / instalment maths (اقساط وام).
 *
 * Standard annuity formula: a fixed monthly payment over `n` months at a
 * monthly rate `i`. When `i = 0` the payment is simply principal / n.
 * Pure functions → unit-tested in finance.test.ts.
 */

export interface LoanInput {
  /** مبلغ وام (principal). */
  principal: number;
  /** نرخ سود سالانه به درصد (e.g. 23 for 23%). */
  annualRatePercent: number;
  /** مدت بازپرداخت به ماه. */
  months: number;
}

export interface LoanResult {
  /** قسط ماهانه. */
  monthlyPayment: number;
  /** مجموع پرداختی. */
  totalPayment: number;
  /** مجموع سود. */
  totalInterest: number;
  /** سود ماهانه (نرخ/۱۲). */
  monthlyRate: number;
  /** جدول بازپرداخت (ماه، قسط، سود، اصل، مانده). */
  schedule: LoanRow[];
}

export interface LoanRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/** Round to whole Rial/Toman — money is never shown with fractions. */
export function roundMoney(value: number): number {
  return Math.round(value);
}

/**
 * Compute the monthly instalment and the full amortisation schedule.
 * Returns null for invalid input (non-positive principal or months).
 */
export function calculateLoan(input: LoanInput): LoanResult | null {
  const { principal, annualRatePercent, months } = input;
  if (!isFinitePositive(principal)) return null;
  if (!isFinitePositive(months) || months < 1) return null;
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0) return null;

  const n = Math.round(months);
  const monthlyRate = annualRatePercent / 100 / 12;

  const monthlyPayment =
    monthlyRate === 0
      ? principal / n
      : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));

  const schedule: LoanRow[] = [];
  let balance = principal;
  for (let month = 1; month <= n; month += 1) {
    const interest = balance * monthlyRate;
    let principalPart = monthlyPayment - interest;
    let payment = monthlyPayment;

    // Final instalment absorbs rounding drift so the balance lands on zero.
    if (month === n) {
      principalPart = balance;
      payment = principalPart + interest;
    }

    balance = Math.max(0, balance - principalPart);
    schedule.push({
      month,
      payment: roundMoney(payment),
      interest: roundMoney(interest),
      principal: roundMoney(principalPart),
      balance: roundMoney(balance),
    });
  }

  const totalPayment = schedule.reduce((sum, row) => sum + row.payment, 0);

  return {
    monthlyPayment: roundMoney(monthlyPayment),
    totalPayment,
    totalInterest: totalPayment - principal,
    monthlyRate,
    schedule,
  };
}

// ---------------------------------------------------------------------------
// BMI (شاخص توده بدنی)
// ---------------------------------------------------------------------------

export type BmiCategory =
  | "کمبود وزن"
  | "وزن نرمال"
  | "اضافه وزن"
  | "چاقی درجه ۱"
  | "چاقی درجه ۲"
  | "چاقی درجه ۳";

export interface BmiResult {
  bmi: number;
  category: BmiCategory;
  /** Healthy weight range (kg) for this height, 18.5–24.9. */
  healthyMin: number;
  healthyMax: number;
  /** Difference to the nearest edge of the healthy range (0 when inside). */
  weightToAdjust: number;
  /** Ideal BMI 22 target weight. */
  idealWeight: number;
}

/** BMI = kg / m² . Returns null for non-positive or absurd input. */
export function calculateBmi(weightKg: number, heightCm: number): BmiResult | null {
  if (!isFinitePositive(weightKg) || !isFinitePositive(heightCm)) return null;
  if (weightKg > 500 || heightCm < 50 || heightCm > 260) return null;

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const healthyMin = 18.5 * heightM * heightM;
  const healthyMax = 24.9 * heightM * heightM;

  let weightToAdjust = 0;
  if (weightKg < healthyMin) weightToAdjust = healthyMin - weightKg;
  else if (weightKg > healthyMax) weightToAdjust = weightKg - healthyMax;

  return {
    bmi: Math.round(bmi * 10) / 10,
    category: bmiCategory(bmi),
    healthyMin: Math.round(healthyMin * 10) / 10,
    healthyMax: Math.round(healthyMax * 10) / 10,
    weightToAdjust: Math.round(weightToAdjust * 10) / 10,
    idealWeight: Math.round(22 * heightM * heightM * 10) / 10,
  };
}

/** WHO cut-offs (used by Iranian health sources as well). */
export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "کمبود وزن";
  if (bmi < 25) return "وزن نرمال";
  if (bmi < 30) return "اضافه وزن";
  if (bmi < 35) return "چاقی درجه ۱";
  if (bmi < 40) return "چاقی درجه ۲";
  return "چاقی درجه ۳";
}
