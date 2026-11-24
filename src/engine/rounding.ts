/**
 * Rounding helpers.
 *
 * Convention (documented):
 * - Tax rates and brackets apply to exact (unrounded) taxable income.
 * - Final tax amounts are rounded half-up to the nearest cent.
 * - CRA payroll formulas round per-period amounts to the cent.
 */
export function roundToCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  // Half-up rounding on cents, robust against binary float error like 0.005 -> 0.00499...
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Portion of income within a bracket: max(0, min(income, upTo) - lower). */
export function amountInBracket(income: number, lower: number, upTo: number | null): number {
  const upper = upTo ?? Infinity;
  return Math.max(0, Math.min(income, upper) - lower);
}
