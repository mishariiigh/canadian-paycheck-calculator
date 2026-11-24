import { getProvincialData } from "./tax-data";
import { roundToCents } from "./rounding";
import type { ProvinceCode } from "./types";

/**
 * Provincial employee payroll taxes withheld from gross pay:
 * - Northwest Territories: 2% Payroll Tax
 * - Nunavut: 2% payroll tax
 * Other provinces: 0 for employees (employer-only payroll taxes not modelled).
 */
export function calculateProvincialPayrollTax(options: {
  province: ProvinceCode;
  grossEmploymentIncome: number;
}): number {
  const data = getProvincialData(options.province);
  if (!data.payrollTax || data.payrollTax.type !== "employee") return 0;
  return roundToCents(options.grossEmploymentIncome * data.payrollTax.rate);
}
