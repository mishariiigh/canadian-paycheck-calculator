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
    // Derive net directly from annual net so per-period nets sum back to the
    // annual total within rounding tolerance (n periods * 0.005 = max drift).
    const net = roundToCents(annual.totals.netAnnualIncome / periods);
    // Total deductions derived from gross - net for internal display consistency.
    const totalDeductions = roundToCents(gross - net);

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
