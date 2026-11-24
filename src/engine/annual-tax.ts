import { calculateFederalTax } from "./federal-tax";
import { calculateProvincialTax } from "./provincial-tax";
import { calculatePension } from "./cpp";
import { calculateEi } from "./ei";
import { calculateProvincialPayrollTax } from "./provincial-payroll-tax";
import { getFederalData, getProvincialData } from "./tax-data";
import { roundToCents } from "./rounding";
import type { ProvinceCode, TaxCalculationInput, TaxCalculationResult } from "./types";

/**
 * Full annual take-home pay calculation.
 *
 * Model: annual T1-style tax calculation with common credits only
 * (basic personal amount + Canada employment amount + CPP/EI credit).
 * Personal circumstances (RRSP, childcare, tuition, etc.) are out of scope
 * except via `otherDeductions`.
 */
export function calculateAnnualTax(input: TaxCalculationInput): TaxCalculationResult {
  const provData = getProvincialData(input.province);

  const gross = Math.max(0, input.grossAnnualIncome);
  const otherDeductions = Math.max(0, input.otherDeductions ?? 0);
  const taxableIncome = Math.max(0, gross - otherDeductions);

  // Net income for enhanced BPA phase-out. Approximated as taxable income +
  // payroll contributions (which are not deductions but do not reduce net income).
  const netIncomeForBpa = taxableIncome;

  const pension = calculatePension({
    province: input.province,
    annualPensionableEarnings: taxableIncome,
    monthsWorked: input.monthsWorked,
  });
  const ei = calculateEi({
    province: input.province,
    annualInsurableEarnings: taxableIncome,
    monthsWorked: input.monthsWorked,
  });

  const abatementRate = provData.federalAbatement?.rate ?? 0;
  const federal = calculateFederalTax({
    taxableIncome,
    netIncomeForBpa,
    cppBaseAndFirstAdditional: pension.base,
    eiPremiums: ei.premium,
    quebecAbatementRate: abatementRate,
  });

  const provincial = calculateProvincialTax({
    province: input.province,
    taxableIncome,
    cppBaseAndFirstAdditional: pension.base,
    eiPremiums: ei.premium,
  });

  const provincialPayrollTax = calculateProvincialPayrollTax({
    province: input.province,
    grossEmploymentIncome: gross,
  });

  const pensionTotal = pension.total;
  const eiTotal = ei.premium;

  const totalTaxAndDeductions = roundToCents(
    federal.effectiveAbatedTax + provincial.totalPayable + pensionTotal + eiTotal + provincialPayrollTax
  );
  const netAnnualIncome = roundToCents(gross - totalTaxAndDeductions);
  const averageTaxRate = gross > 0 ? roundToCents((totalTaxAndDeductions / gross) * 100) / 100 : 0;

  // Marginal rate: combined federal + provincial top bracket containing taxableIncome,
  // simplified (no credit phase-outs).
  const marginal = marginalRate(input.province, taxableIncome);

  return {
    grossAnnualIncome: roundToCents(gross),
    taxableIncome: roundToCents(taxableIncome),
    federal: {
      grossTax: federal.grossTax,
      bpaCredit: federal.bpaCredit,
      employmentCredit: federal.employmentCredit,
      cppEiCredit: federal.cppEiCredit,
      netTax: federal.netTax,
      abatement: federal.abatement,
      effectiveAbatedTax: federal.effectiveAbatedTax,
    },
    provincial: {
      grossTax: provincial.grossTax,
      bpaCredit: provincial.bpaCredit,
      cppEiCredit: provincial.cppEiCredit,
      surtax: provincial.surtax,
      netTaxBeforeSurtaxAdjustment: roundToCents(provincial.netTax - provincial.surtax),
      netTax: provincial.netTax,
      healthPremium: provincial.healthPremium,
      totalPayable: provincial.totalPayable,
    },
    payroll: {
      pensionName: pension.name,
      pensionBase: pension.base,
      pensionFirstAdditional: 0,
      pensionSecondAdditional: pension.secondAdditional,
      pensionTotal,
      ei: eiTotal,
      eiName: ei.name,
      provincialPayrollTax,
    },
    totals: {
      totalTaxAndDeductions,
      netAnnualIncome,
      averageTaxRate,
      marginalRate: marginal,
    },
    breakdownByBracket: [
      ...federal.breakdown.map((b) => ({ jurisdiction: "federal" as const, ...b })),
      ...provincial.breakdown.map((b) => ({ jurisdiction: "provincial" as const, ...b })),
    ],
  };
}

function marginalRate(province: ProvinceCode, taxableIncome: number): number {
  const fed = getFederalData();
  const prov = getProvincialData(province);
  const fedRate = fed.taxBrackets.find((b) => b.upTo === null || taxableIncome <= b.upTo)?.rate ?? fed.taxBrackets[fed.taxBrackets.length - 1].rate;
  const provRate = prov.taxBrackets.find((b) => b.upTo === null || taxableIncome <= b.upTo)?.rate ?? prov.taxBrackets[prov.taxBrackets.length - 1].rate;
  let rate = fedRate + provRate;
  // Quebec abatement reduces effective federal rate.
  if (prov.federalAbatement) rate -= fedRate * prov.federalAbatement.rate;
  // Ontario surtax raises marginal rate in top brackets (approximate: 56% surtax on top ON rate).
  if (province === "ON" && prov.surtax && taxableIncome > prov.surtax.tiers[prov.surtax.tiers.length - 1].onTaxOver) {
    rate += provRate * 0.56;
  }
  return roundToCents(rate * 100) / 100;
}

export { calculateFederalTax, calculateProvincialTax };
