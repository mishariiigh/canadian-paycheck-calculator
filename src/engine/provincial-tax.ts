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
}): {
  grossTax: number;
  bpaCredit: number;
  cppEiCredit: number;
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
    surtax: roundToCents(surtax),
    netTax,
    healthPremium,
    totalPayable,
    breakdown,
  };
}
