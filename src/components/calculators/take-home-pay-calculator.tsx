"use client";

import { useMemo, useState } from "react";
import { ALL_PROVINCES } from "@/engine/tax-data";
import { calculateFull } from "@/engine/payroll";
import { PAY_FREQUENCIES, type ProvinceCode, type PayFrequency } from "@/engine/types";
import { TakeHomeSummary, PerPeriodTable } from "@/components/calculators/result-cards";
import { TakeHomeBarChart } from "@/components/charts/take-home-chart";
import { formatCurrency, formatFrequency, formatPercent } from "@/lib/formatting";

export function TakeHomePayCalculator({
  defaultProvince = "ON",
  defaultFrequency = "biweekly",
}: {
  defaultProvince?: ProvinceCode;
  defaultFrequency?: PayFrequency;
} = {}) {
  const [income, setIncome] = useState(80000);
  const [province, setProvince] = useState<ProvinceCode>(defaultProvince);
  const [frequency, setFrequency] = useState<PayFrequency>(defaultFrequency);
  const [deductions, setDeductions] = useState(0);

  const result = useMemo(
    () => calculateFull({ grossAnnualIncome: income, province, taxYear: 2026, otherDeductions: deductions }),
    [income, province, deductions]
  );

  const selected = result.perPeriod.find((p) => p.frequency === frequency)!;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6 min-w-0">
          <div className="sfx-card p-6">
            <h2 className="sfx-h3 mb-5">Your income</h2>

            <div className="space-y-5">
              <div className="space-y-1">
                <label className="sfx-label">Gross annual income</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={income}
                    onChange={(e) =>
                      setIncome(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="sfx-input sfx-input--currency"
                    placeholder="e.g. 80,000"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="sfx-label">Province or territory</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value as ProvinceCode)}
                  className="sfx-select"
                >
                  {ALL_PROVINCES.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="sfx-label">Pay frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as PayFrequency)}
                  className="sfx-select"
                >
                {([
                  ["weekly", "Weekly"],
                  ["biweekly", "Bi-weekly"],
                  ["semiMonthly", "Semi-monthly"],
                  ["monthly", "Monthly"],
                  ["annual", "Annual"],
                ] as const).map(([key, label]) => {
                  const info = PAY_FREQUENCIES[key as PayFrequency];
                  return (
                    <option key={key} value={key as PayFrequency}>
                      {label} ({info.periodsPerYear}/yr)
                    </option>
                  );
                })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="sfx-label">Other annual deductions (e.g. RRSP)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={deductions}
                    onChange={(e) =>
                      setDeductions(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="sfx-input sfx-input--currency"
                    placeholder="0"
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Additional pre-tax amounts deducted from your gross income.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6 min-w-0">
          <div className="sfx-card sfx-card--elevated p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Estimated net pay ({formatFrequency(frequency)})
                </p>
                <p className="text-4xl font-bold text-[var(--color-success)] money leading-none">
                  {formatCurrency(selected.net)}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {formatCurrency(selected.totalDeductions, { decimals: 0 })} total deductions
                </p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  Effective rate
                </p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {formatPercent(selected.totalDeductions / selected.gross, 1)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4 text-sm">
              <Stat
                label="Gross"
                value={formatCurrency(selected.gross, { decimals: 2 })}
                muted
              />
              <Stat
                label="Tax"
                value={-(selected.federalTax + selected.provincialTax + selected.provincialPayrollTax)}
                negative
              />
              <Stat
                label="Pension"
                value={-selected.pension}
                negative
              />
              <Stat
                label="EI/QPIP"
                value={-selected.ei}
                negative
              />
            </div>
          </div>

          <TakeHomeSummary result={result.annual} />
          <TakeHomeBarChart result={result.annual} />
          <PerPeriodTable periods={result.perPeriod} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, negative, muted }: { label: string; value: string | number; negative?: boolean; muted?: boolean }) {
  return (
    <div className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)]">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
        {label}
      </p>
      <p className={`tabular-nums font-semibold ${muted ? "text-[var(--color-text-muted)]" : negative ? "text-[var(--color-danger)]" : "text-[var(--color-text-primary)]"}`}>
        {typeof value === "number" ? formatCurrency(value) : value}
      </p>
    </div>
  );
}
