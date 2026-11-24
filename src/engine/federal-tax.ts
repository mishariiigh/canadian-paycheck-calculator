import { getFederalData } from "./tax-data";
import { amountInBracket, roundToCents } from "./rounding";
import type { TaxBracket } from "./types";

export interface BracketBreakdown {
  rate: number;
  from: number;
  to: number | null;
  taxableInBracket: number;
  tax: number;
}

export interface ProgressiveTaxResult {
  grossTax: number;
  breakdown: BracketBreakdown[];
}

/**
 * Progressive tax on taxable income using bracket table.
 * This is the "gross tax before non-refundable credits".
 */
export function calculateProgressiveTax(
  taxableIncome: number,
  brackets: TaxBracket[]
): ProgressiveTaxResult {
  const breakdown: BracketBreakdown[] = [];
  let lower = 0;
  let grossTax = 0;

  for (const bracket of brackets) {
    const taxableInBracket = amountInBracket(taxableIncome, lower, bracket.upTo);
    const tax = taxableInBracket * bracket.rate;
    if (taxableInBracket > 0) {
      breakdown.push({
        rate: bracket.rate,
        from: lower,
        to: bracket.upTo,
        taxableInBracket,
        tax,
      });
      grossTax += tax;
    }
    lower = bracket.upTo ?? Infinity;
    if (bracket.upTo !== null && taxableIncome <= bracket.upTo) break;
  }

  return { grossTax, breakdown };
}

/**
 * Federal basic personal amount (enhanced). The maximum BPA applies when
 * net income <= phaseOutStart; it is reduced straight-line to the minimum
 * at phaseOutEnd.
 */
export function federalBasicPersonalAmount(netIncome: number): number {
  const bpa = getFederalData().basicPersonalAmount;
  if (netIncome <= bpa.phaseOutStartNetIncome) return bpa.maximum;
  if (netIncome >= bpa.phaseOutEndNetIncome) return bpa.minimum;
  const ratio = (netIncome - bpa.phaseOutStartNetIncome) / (bpa.phaseOutEndNetIncome - bpa.phaseOutStartNetIncome);
  return bpa.maximum - ratio * (bpa.maximum - bpa.minimum);
}

/**
 * Federal income tax, non-refundable credits, and the Quebec abatement.
 * Follows the annual return logic (T1), not per-period CRA payroll rounding.
 */
export function calculateFederalTax(options: {
  taxableIncome: number;
  netIncomeForBpa: number;
  cppBaseAndFirstAdditional: number;
  eiPremiums: number;
  quebecAbatementRate: number; // 0.165 for QC, else 0
}): {
  grossTax: number;
  bpaCredit: number;
  employmentCredit: number;
  cppEiCredit: number;
  netTax: number;
  abatement: number;
  effectiveAbatedTax: number;
  breakdown: BracketBreakdown[];
} {
  const fed = getFederalData();
  const { grossTax, breakdown } = calculateProgressiveTax(options.taxableIncome, fed.taxBrackets);

  const bpaAmount = federalBasicPersonalAmount(options.netIncomeForBpa);
  const bpaCredit = bpaAmount * fed.basicPersonalAmount.creditRate;
  const employmentCredit = fed.otherCredits.employmentAmount * fed.basicPersonalAmount.creditRate;
  // CPP base + first additional and EI are creditable; CPP2/QPP2 is not.
  const cppEiCredit = (options.cppBaseAndFirstAdditional + options.eiPremiums) * fed.basicPersonalAmount.creditRate;

  const netTax = Math.max(0, roundToCents(grossTax) - bpaCredit - employmentCredit - cppEiCredit);

  const abatement = options.quebecAbatementRate > 0 ? roundToCents(netTax * options.quebecAbatementRate) : 0;
  const effectiveAbatedTax = netTax - abatement;

  return {
    grossTax: roundToCents(grossTax),
    bpaCredit: roundToCents(bpaCredit),
    employmentCredit: roundToCents(employmentCredit),
    cppEiCredit: roundToCents(cppEiCredit),
    netTax,
    abatement,
    effectiveAbatedTax: roundToCents(effectiveAbatedTax),
    breakdown,
  };
}
