"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ALL_PROVINCES } from "@/engine/tax-data";
import { calculateAnnualTax } from "@/engine/annual-tax";
import { takeHomePayUrl } from "@/lib/seo";
import { formatCurrency } from "@/lib/formatting";

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
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <label className="block max-w-xs">
          <span className="mb-1 block text-sm font-medium text-gray-700">Gross annual salary ($)</span>
          <input
            type="number"
            min={0}
            value={salary}
            onChange={(e) => setSalary(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Net pay by province ({formatCurrency(salary)} gross)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4 font-medium">Province</th>
              <th className="py-2 pr-4 text-right font-medium">Total tax &amp; deductions</th>
              <th className="py-2 pr-4 text-right font-medium">Net annual</th>
              <th className="py-2 pr-4 text-right font-medium">Net monthly</th>
              <th className="py-2 text-right font-medium">Avg. rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((r) => (
              <tr key={r.province.code}>
                <td className="py-2 pr-4">
                  <Link href={takeHomePayUrl(r.province.code, salary)} className="text-blue-700 hover:underline">
                    {r.province.name}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(r.totals.totalTaxAndDeductions)}</td>
                <td className="py-2 pr-4 text-right font-semibold tabular-nums text-green-700">{formatCurrency(r.totals.netAnnualIncome)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(r.totals.netAnnualIncome / 12)}</td>
                <td className="py-2 text-right tabular-nums text-gray-500">{(r.totals.averageTaxRate * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
