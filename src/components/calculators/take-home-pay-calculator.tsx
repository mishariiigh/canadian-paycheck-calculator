"use client";

import { useMemo, useState } from "react";
import { ALL_PROVINCES } from "@/engine/tax-data";
import { calculateFull } from "@/engine/payroll";
import type { ProvinceCode } from "@/engine/types";
import { TakeHomeSummary, PerPeriodTable } from "@/components/calculators/result-cards";
import { TakeHomeBarChart } from "@/components/charts/take-home-chart";

export function TakeHomePayCalculator({ defaultProvince = "ON" }: { defaultProvince?: ProvinceCode }) {
  const [income, setIncome] = useState(80000);
  const [province, setProvince] = useState<ProvinceCode>(defaultProvince);
  const [deductions, setDeductions] = useState(0);

  const result = useMemo(
    () => calculateFull({ grossAnnualIncome: income, province, taxYear: 2026, otherDeductions: deductions }),
    [income, province, deductions]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Gross annual income</span>
            <input
              type="number"
              min={0}
              value={income}
              onChange={(e) => setIncome(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Province or territory</span>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value as ProvinceCode)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {ALL_PROVINCES.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Other annual deductions (e.g. RRSP)</span>
            <input
              type="number"
              min={0}
              value={deductions}
              onChange={(e) => setDeductions(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
        </div>
      </div>

      <TakeHomeSummary result={result.annual} />
      <TakeHomeBarChart result={result.annual} />
      <PerPeriodTable periods={result.perPeriod} />
    </div>
  );
}
