import { PAY_FREQUENCIES, type PayFrequency, type PerPeriodResult, type TaxCalculationInput } from "./types";
import { calculateAnnualTax } from "./annual-tax";
import { roundToCents } from "./rounding";

/**
 * Split annual results into per-period amounts.
 * Annual deduction amounts are divided evenly across pay periods.
 */
export function calculatePayrollPeriods(
  input: TaxCalculationInput,
  frequencies: PayFrequency[] = ["weekly", "biweekly", "semiMonthly", "monthly"]
): PerPeriodResult[] {
  const annual = calculateAnnualTax(input);

  return frequencies.map((frequency) => {
    const periods = PAY_FREQUENCIES[frequency].periodsPerYear;
    const gross = roundToCents(annual.grossAnnualIncome / periods);
    const federalTax = roundToCents((annual.federal.effectiveAbatedTax) / periods);
    const provincialTax = roundToCents(annual.provincial.totalPayable / periods);
    const pension = roundToCents(annual.payroll.pensionTotal / periods);
    const ei = roundToCents(annual.payroll.ei / periods);
    const provincialPayrollTax = roundToCents(annual.payroll.provincialPayrollTax / periods);
    const totalDeductions = roundToCents(federalTax + provincialTax + pension + ei + provincialPayrollTax);
    const net = roundToCents(gross - totalDeductions);

    return {
      frequency,
      periodsPerYear: periods,
      gross,
      federalTax,
      provincialTax,
      pension,
      ei,
      provincialPayrollTax,
      totalDeductions,
      net,
    };
  });
}

export interface FullCalculation {
  annual: ReturnType<typeof calculateAnnualTax>;
  perPeriod: PerPeriodResult[];
}

export function calculateFull(input: TaxCalculationInput): FullCalculation {
  return {
    annual: calculateAnnualTax(input),
    perPeriod: calculatePayrollPeriods(input),
  };
}
