import type { TaxCalculationResult, PerPeriodResult } from "@/engine/types";
import { formatCurrency, formatFrequency, formatPercent } from "@/lib/formatting";

export function TakeHomeSummary({ result }: { result: TaxCalculationResult }) {
  return (
    <div className="sfx-card sfx-card--elevated">
      <div className="px-6 py-6 border-b border-[var(--color-border)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
          Estimated take-home pay
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-[var(--color-success)] money leading-none">
            {formatCurrency(result.totals.netAnnualIncome)}
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">net per year</span>
        </div>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Annual figures are an estimated year-end tax liability based on 2026 brackets and
          credits — not actual payroll withholding amounts.
        </p>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-3">
        <div className="bg-[var(--color-background)] p-4 rounded-[var(--radius-md)] border border-[var(--color-border)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            Gross annual income
          </p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)] money">
            {formatCurrency(result.grossAnnualIncome)}
          </p>
        </div>
        <div className="bg-[var(--color-background)] p-4 rounded-[var(--radius-md)] border border-[var(--color-border)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            Average tax rate
          </p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            {formatPercent(result.totals.averageTaxRate, 1)}
          </p>
        </div>
        <div className="bg-[var(--color-background)] p-4 rounded-[var(--radius-md)] border border-[var(--color-border)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            Marginal tax rate
          </p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            {formatPercent(result.totals.marginalRate, 2)}
          </p>
        </div>
      </div>

      <div className="px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          Where your gross pay goes (annual)
        </p>
        <table className="sfx-table w-full text-sm">
          <tbody className="divide-y divide-[var(--color-border)]">
            <DeductionRow
              label="Gross annual income"
              value={result.grossAnnualIncome}
            />
            <DeductionRow
              label={`Federal tax${result.federal.abatement ? " (net of QC abatement)" : ""}`}
              value={-result.federal.effectiveAbatedTax}
            />
            <DeductionRow
              label={`Provincial tax${result.provincial.healthPremium ? " (incl. health premium)" : ""}`}
              value={-result.provincial.totalPayable}
            />
            <DeductionRow
              label={`${result.payroll.pensionName} contributions`}
              value={-result.payroll.pensionTotal}
            />
            <DeductionRow
              label={result.payroll.eiName === "QPIP" ? "EI + QPIP premiums" : "EI premiums"}
              value={-result.payroll.ei}
            />
            {result.payroll.provincialPayrollTax > 0 && (
              <DeductionRow label="Provincial payroll tax" value={-result.payroll.provincialPayrollTax} />
            )}
            <DeductionRow
              label="Net annual income"
              value={result.totals.netAnnualIncome}
              total
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeductionRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total?: boolean;
}) {
  const isNegative = value < 0;
  return (
    <tr className={total ? "font-semibold text-[var(--color-text-primary)]" : ""}>
      <td className="py-3 text-[var(--color-text-secondary)]">
        {label}
      </td>
      <td className="py-3 text-right tabular-nums">
        {total ? (
          <span className="money money--primary">{formatCurrency(value)}</span>
        ) : isNegative ? (
          <span className="money money--negative">-{formatCurrency(Math.abs(value), { decimals: 2 })}</span>
        ) : (
          <span className="money money--positive">{formatCurrency(value, { decimals: 2 })}</span>
        )}
      </td>
    </tr>
  );
}

export function PerPeriodTable({ periods }: { periods: PerPeriodResult[] }) {
  return (
    <div className="sfx-card">
      <div className="px-6 py-5 border-b border-[var(--color-border)]">
        <h3 className="sfx-h3 mb-1">Net pay by pay frequency</h3>
        <p className="text-xs text-[var(--color-text-muted)]">
          Per-period figures divide annual tax amounts evenly across pay periods. They are
          estimates, not actual CRA payroll withholding calculations (T4127).
        </p>
      </div>
      <div className="sfx-table-scroll">
        <table className="sfx-table sfx-table--fixed w-full text-sm">
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "17%" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-4 py-3">Frequency</th>
              <th className="px-4 py-3 text-right">Gross</th>
              <th className="px-4 py-3 text-right">Income tax</th>
              <th className="px-4 py-3 text-right">Pension</th>
              <th className="px-4 py-3 text-right">EI/QPIP</th>
              <th className="px-4 py-3 text-right">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {periods.map((p) => (
              <tr key={p.frequency}>
                <td className="px-4 py-3">
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {formatFrequency(p.frequency)}
                  </span>{" "}
                  <span className="text-xs text-[var(--color-text-muted)]">
                    ({p.periodsPerYear}/yr)
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(p.gross, { decimals: 2 })}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text-muted)]">
                  -{formatCurrency(p.federalTax + p.provincialTax + p.provincialPayrollTax, { decimals: 2 })}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text-muted)]">
                  -{formatCurrency(p.pension, { decimals: 2 })}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text-muted)]">
                  -{formatCurrency(p.ei, { decimals: 2 })}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums money money--positive">
                  {formatCurrency(p.net, { decimals: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
