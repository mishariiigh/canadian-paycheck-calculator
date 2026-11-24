import { getProvincialData } from "./tax-data";
import { calculateProgressiveTax, type BracketBreakdown } from "./federal-tax";
import { roundToCents } from "./rounding";
import type { ProvinceCode } from "./types";

export function calculateOntarioSurtax(ontarioTax: number): number {
  const data = getProvincialData("ON");
  if (!data.surtax) return 0;
  let surtax = 0;
  for (const tier of data.surtax.tiers) {
    const excess = Math.max(0, ontarioTax - tier.onTaxOver);
    if (excess > 0) surtax += excess * tier.rate;
  }
  return surtax;
}

export function calculateOntarioHealthPremium(taxableIncome: number): number {
  const data = getProvincialData("ON");
  if (!data.healthPremium) return 0;
  let lower = 0;
  for (const band of data.healthPremium.bands) {
    if (taxableIncome <= (band.upTo ?? Infinity)) {
      if (band.amount !== null) return roundToCents(band.amount);
      // Variable band: base + rate * (income - over)
      const excess = Math.max(0, taxableIncome - band.over);
      return roundToCents(band.base + excess * band.rate);
    }
    lower = band.upTo ?? lower;
  }
  return 0;
}

export function calculateProvincialTax(options: {
  province: ProvinceCode;
  taxableIncome: number;
  cppBaseAndFirstAdditional: number;
  eiPremiums: number;
  hasQualifiedRelation?: boolean;
  claimsEligibleDependant?: boolean;
  adjustedIncome?: number;
}): {
  grossTax: number;
  bpaCredit: number;
  cppEiCredit: number;
  lowIncomeReduction: number;
  surtax: number;
  netTax: number;
  healthPremium: number;
  totalPayable: number;
  breakdown: BracketBreakdown[];
} {
  const data = getProvincialData(options.province);
  const { grossTax, breakdown } = calculateProgressiveTax(options.taxableIncome, data.taxBrackets);

  const bpaCredit = data.basicPersonalAmount.amount * data.basicPersonalAmount.creditRate;
  const cppEiCredit = (options.cppBaseAndFirstAdditional + options.eiPremiums) * data.basicPersonalAmount.creditRate;

  let netTax = Math.max(0, roundToCents(grossTax) - bpaCredit - cppEiCredit);

  // Newfoundland and Labrador Low-Income Tax Reduction (Income Tax Act, 2000 s.21.1; Reg 18/26).
  // Subsection (2): reduction = max(0, (A + B) - 0.16 * max(0, adjustedIncome - threshold)).
  //   A = amount prescribed by regulation (21.1(2.1)(a)) — $842 for 2026.
  //   B = amount prescribed by regulation (21.1(2.1)(b)) — $563 for 2026, only when
  //       the individual has a qualified relation OR claims an amount under 9(1)(b).
  //   Threshold = indexed individual threshold (21.1(2)(b)) when neither condition applies;
  //               indexed family threshold (21.1(2)(c)) when either condition applies.
  //   Non-refundable: cannot exceed tax otherwise payable (applied last per s.21.1(5)).
  //   Adjusted income per s.21.1(1)(a) includes qualified relation's income per federal s.122.6.
  //   An eligible dependant's income is NOT included in adjusted income.
  let lowIncomeReduction = 0;
  if (options.province === "NL" && data.lowIncomeReduction) {
    const litr = data.lowIncomeReduction;
    const adjustedIncome = options.adjustedIncome ?? options.taxableIncome;
    const hasRelationOrDependant = options.hasQualifiedRelation ?? options.claimsEligibleDependant ?? false;
    const amountA = litr.amountA;
    const amountB = hasRelationOrDependant ? litr.amountB : 0;
    const threshold = hasRelationOrDependant ? litr.thresholdFamily : litr.thresholdIndividual;
    const excess = Math.max(0, adjustedIncome - threshold);
    lowIncomeReduction = Math.max(0, roundToCents(amountA + amountB - litr.clawbackRate * excess));
    lowIncomeReduction = Math.min(lowIncomeReduction, netTax);
    netTax = roundToCents(netTax - lowIncomeReduction);
  }

  let surtax = 0;
  if (options.province === "ON" && data.surtax) {
    // Surtax is calculated on the tax (net of credits, before surtax).
    surtax = calculateOntarioSurtax(netTax);
    netTax = roundToCents(netTax + surtax);
  }

  let healthPremium = 0;
  if (options.province === "ON") {
    healthPremium = calculateOntarioHealthPremium(options.taxableIncome);
  }

  const totalPayable = roundToCents(netTax + healthPremium);

  return {
    grossTax: roundToCents(grossTax),
    bpaCredit: roundToCents(bpaCredit),
    cppEiCredit: roundToCents(cppEiCredit),
    lowIncomeReduction: roundToCents(lowIncomeReduction),
    surtax: roundToCents(surtax),
    netTax,
    healthPremium,
    totalPayable,
    breakdown,
  };
}
