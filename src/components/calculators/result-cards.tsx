import type { TaxCalculationResult, PerPeriodResult } from "@/engine/types";
import { formatCurrency, formatFrequency, formatPercent } from "@/lib/formatting";

export function TakeHomeSummary({ result }: { result: TaxCalculationResult }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="text-sm text-gray-500">Estimated net annual income (T1-style estimate)</p>
          <p className="text-3xl font-bold text-green-700">{formatCurrency(result.totals.netAnnualIncome)}</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Average rate: {formatPercent(result.totals.averageTaxRate, 1)}</p>
          <p>Marginal rate: {formatPercent(result.totals.marginalRate, 2)}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 mb-4">
        Annual figures are estimated year-end tax liability based on 2026 tax brackets and credits.
        They are not actual payroll withholding amounts, which may differ due to per-period
        rounding and CRA T4127 payroll deduction formulas.
      </p>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-100">
          <Row label="Gross annual income" value={result.grossAnnualIncome} bold />
          <Row label={`Federal tax${result.federal.abatement ? " (net of QC abatement)" : ""}`} value={-result.federal.effectiveAbatedTax} />
          <Row label={`Provincial tax${result.provincial.healthPremium ? " (incl. health premium)" : ""}`} value={-result.provincial.totalPayable} />
          <Row label={`${result.payroll.pensionName} contributions`} value={-result.payroll.pensionTotal} />
          <Row label={result.payroll.eiName === "QPIP" ? "EI + QPIP premiums" : "EI premiums"} value={-result.payroll.ei} />
          {result.payroll.provincialPayrollTax > 0 && (
            <Row label="Provincial payroll tax" value={-result.payroll.provincialPayrollTax} />
          )}
          <Row label="Net annual income" value={result.totals.netAnnualIncome} bold highlight />
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: number; bold?: boolean; highlight?: boolean }) {
  return (
    <tr className={highlight ? "font-semibold text-green-700" : bold ? "font-medium" : ""}>
      <td className="py-2">{label}</td>
      <td className={`py-2 text-right tabular-nums ${value < 0 ? "text-red-700" : ""}`}>
        {formatCurrency(value, { decimals: 2 })}
      </td>
    </tr>
  );
}

export function PerPeriodTable({ periods }: { periods: PerPeriodResult[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Net pay by pay frequency</h3>
      <p className="text-xs text-gray-500 mb-4">
        Per-period figures divide annual tax amounts evenly across pay periods. They are estimates,
        not actual CRA payroll withholding calculations (T4127). Actual payroll deductions may vary
        due to per-period rounding, cumulative averaging, and mid-year tax changes.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 pr-4 font-medium">Frequency</th>
            <th className="py-2 pr-4 text-right font-medium">Gross</th>
            <th className="py-2 pr-4 text-right font-medium">Income tax</th>
            <th className="py-2 pr-4 text-right font-medium">Pension</th>
            <th className="py-2 pr-4 text-right font-medium">EI/QPIP</th>
            <th className="py-2 text-right font-medium">Net</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {periods.map((p) => (
            <tr key={p.frequency}>
              <td className="py-2 pr-4">{formatFrequency(p.frequency)} <span className="text-gray-400">({p.periodsPerYear}/yr)</span></td>
              <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(p.gross, { decimals: 2 })}</td>
              <td className="py-2 pr-4 text-right tabular-nums text-red-700">
                -{formatCurrency(p.federalTax + p.provincialTax + p.provincialPayrollTax, { decimals: 2 })}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums text-red-700">-{formatCurrency(p.pension, { decimals: 2 })}</td>
              <td className="py-2 pr-4 text-right tabular-nums text-red-700">-{formatCurrency(p.ei, { decimals: 2 })}</td>
              <td className="py-2 text-right font-semibold tabular-nums text-green-700">{formatCurrency(p.net, { decimals: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
