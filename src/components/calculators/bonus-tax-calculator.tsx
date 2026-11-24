"use client";

import { useMemo, useState } from "react";
import { ALL_PROVINCES } from "@/engine/tax-data";
import { calculateBonusTax } from "@/engine/salary-conversion";
import type { ProvinceCode } from "@/engine/types";
import { formatCurrency } from "@/lib/formatting";

export function BonusTaxCalculator() {
  const [salary, setSalary] = useState(80000);
  const [bonus, setBonus] = useState(5000);
  const [province, setProvince] = useState<ProvinceCode>("ON");

  const result = useMemo(
    () => calculateBonusTax({ province, baseSalary: salary, bonus }),
    [salary, bonus, province]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Base annual salary ($)</span>
          <input type="number" min={0} value={salary} onChange={(e) => setSalary(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Bonus ($)</span>
          <input type="number" min={0} value={bonus} onChange={(e) => setBonus(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Province</span>
          <select value={province} onChange={(e) => setProvince(e.target.value as ProvinceCode)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
            {ALL_PROVINCES.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Bonus breakdown</h2>
        <table className="mt-3 w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            <tr><td className="py-2">Gross bonus</td><td className="py-2 text-right tabular-nums">{formatCurrency(result.bonusGross, { decimals: 2 })}</td></tr>
            <tr><td className="py-2">Federal income tax</td><td className="py-2 text-right tabular-nums text-red-700">-{formatCurrency(result.bonusFederalTax, { decimals: 2 })}</td></tr>
            <tr><td className="py-2">Provincial income tax</td><td className="py-2 text-right tabular-nums text-red-700">-{formatCurrency(result.bonusProvincialTax, { decimals: 2 })}</td></tr>
            {result.bonusPension > 0 && (
              <tr><td className="py-2">CPP/QPP on bonus (remaining room)</td><td className="py-2 text-right tabular-nums text-red-700">-{formatCurrency(result.bonusPension, { decimals: 2 })}</td></tr>
            )}
            {result.bonusEi > 0 && (
              <tr><td className="py-2">EI on bonus (remaining room)</td><td className="py-2 text-right tabular-nums text-red-700">-{formatCurrency(result.bonusEi, { decimals: 2 })}</td></tr>
            )}
            {result.bonusProvincialPayrollTax > 0 && (
              <tr><td className="py-2">Provincial payroll tax</td><td className="py-2 text-right tabular-nums text-red-700">-{formatCurrency(result.bonusProvincialPayrollTax, { decimals: 2 })}</td></tr>
            )}
            <tr className="font-semibold text-green-700"><td className="py-2">Net bonus</td><td className="py-2 text-right tabular-nums">{formatCurrency(result.bonusNet, { decimals: 2 })}</td></tr>
            <tr><td className="py-2 text-gray-500">Effective marginal rate on bonus</td><td className="py-2 text-right tabular-nums text-gray-500">{(result.effectiveMarginalRate * 100).toFixed(1)}%</td></tr>
          </tbody>
        </table>
        <p className="mt-4 text-xs text-gray-500">
          Employers may withhold at a flat source-deduction rate during the year; actual tax is
          settled on your return at your marginal rate, which this estimate reflects.
        </p>
      </div>
    </div>
  );
}
