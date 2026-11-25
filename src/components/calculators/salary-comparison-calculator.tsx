"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ALL_PROVINCES } from "@/engine/tax-data";
import { calculateAnnualTax } from "@/engine/annual-tax";
import { takeHomePayUrl } from "@/lib/seo";
import { formatCurrency, formatPercent } from "@/lib/formatting";

export function SalaryComparisonCalculator() {
  const [salary, setSalary] = useState(100000);

  const results = useMemo(
    () =>
      ALL_PROVINCES.map((p) => ({
        province: p,
        ...calculateAnnualTax({ grossAnnualIncome: salary, province: p.code, taxYear: 2026 }),
      })).sort((a, b) => b.totals.netAnnualIncome - a.totals.netAnnualIncome),
    [salary]
  );

  return (
    <div className="space-y-8">
      <div className="sfx-card p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <label className="sfx-label">Gross annual salary</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                $
              </span>
              <input
                type="number"
                min={0}
                step={5000}
                value={salary}
                onChange={(e) => setSalary(Math.max(0, Number(e.target.value) || 0))}
                className="sfx-input sfx-input--currency"
              />
            </div>
          </div>
          <Link
            href="/calculators/take-home-pay"
            className="sfx-button sfx-button--primary hidden md:block"
          >
            Open calculator
          </Link>
        </div>
      </div>

      <div className="sfx-card">
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <h3 className="sfx-h3 mb-1">Net pay by province</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Same gross salary ({formatCurrency(salary)}), compared across all 13 provinces
            and territories for 2026.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="sfx-table w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left">
                <th className="px-4 py-3 font-medium">Province</th>
                <th className="px-4 py-3 text-right font-medium">Total tax &amp; deductions</th>
                <th className="px-4 py-3 text-right font-medium">Net annual</th>
                <th className="px-4 py-3 text-right font-medium">Net monthly</th>
                <th className="px-4 py-3 text-right font-medium">Avg. rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {results.map((r) => (
                <tr key={r.province.code}>
                  <td className="px-4 py-3">
                    <Link
                      href={takeHomePayUrl(r.province.code, salary)}
                      className="sfx-link font-medium text-[var(--color-text-primary)]"
                    >
                      {r.province.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text-muted)]">
                    {formatCurrency(r.totals.totalTaxAndDeductions)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--color-success)] money">
                    {formatCurrency(r.totals.netAnnualIncome)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(r.totals.netAnnualIncome / 12)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text-muted)]">
                    {formatPercent(r.totals.averageTaxRate, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
