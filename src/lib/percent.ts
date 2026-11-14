/**
 * Percentage and discount maths.
 *
 * Pure functions; each one returns `null` for invalid input so the UI can show
 * a friendly message instead of `NaN`.
 */

export interface PercentOfResult {
  value: number;
}

/** «X درصد از Y» → مقدار */
export function percentOf(percent: number, total: number): number | null {
  if (!Number.isFinite(percent) || !Number.isFinite(total)) return null;
  return (percent / 100) * total;
}

/** «X چند درصد از Y است؟» → درصد */
export function whatPercent(part: number, total: number): number | null {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total === 0) return null;
  return (part / total) * 100;
}

export interface PercentChangeResult {
  /** Positive for an increase, negative for a decrease. */
  change: number;
  direction: "increase" | "decrease" | "same";
}

/** «از X به Y چند درصد تغییر کرد؟» */
export function percentChange(from: number, to: number): PercentChangeResult | null {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === 0) return null;
  const change = ((to - from) / Math.abs(from)) * 100;
  const direction = change > 0 ? "increase" : change < 0 ? "decrease" : "same";
  return { change, direction };
}

export interface DiscountResult {
  /** Amount taken off. */
  discountAmmount: number;
  /** Price the customer pays. */
  finalPrice: number;
  /** Effective discount percentage (useful in fixed-amount mode). */
  effectivePercent: number;
}

/** Discount by percentage. */
export function discountByPercent(price: number, percent: number): DiscountResult | null {
  if (!Number.isFinite(price) || !Number.isFinite(percent)) return null;
  if (price < 0 || percent < 0) return null;
  const discountAmmount = (price * percent) / 100;
  return {
    discountAmmount,
    finalPrice: price - discountAmmount,
    effectivePercent: percent,
  };
}

/** Discount by a fixed amount. */
export function discountByAmount(price: number, amount: number): DiscountResult | null {
  if (!Number.isFinite(price) || !Number.isFinite(amount)) return null;
  if (price < 0 || amount < 0) return null;
  const finalPrice = Math.max(0, price - amount);
  const effectivePercent = price === 0 ? 0 : (amount / price) * 100;
  return {
    discountAmmount: Math.min(amount, price),
    finalPrice,
    effectivePercent,
  };
}

/**
 * Recover the original price from a discounted price:
 * «قیمت نهایی X تومان با Y درصد تخفیف — قیمت اصلی چند بود؟»
 */
export function originalPriceFromDiscounted(
  discountedPrice: number,
  percent: number,
): { originalPrice: number; discountAmmount: number } | null {
  if (!Number.isFinite(discountedPrice) || !Number.isFinite(percent)) return null;
  if (discountedPrice < 0 || percent < 0 || percent >= 100) return null;
  const originalPrice = discountedPrice / (1 - percent / 100);
  return { originalPrice, discountAmmount: originalPrice - discountedPrice };
}
