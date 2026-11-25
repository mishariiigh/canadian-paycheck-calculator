"use client";

import { useMemo, useState } from "react";
import { ALL_PROVINCES } from "@/engine/tax-data";
import { calculateBonusTax } from "@/engine/salary-conversion";
import type { ProvinceCode } from "@/engine/types";
import { formatCurrency, formatPercent } from "@/lib/formatting";

export function BonusTaxCalculator() {
  const [salary, setSalary] = useState(80000);
  const [bonus, setBonus] = useState(5000);
  const [province, setProvince] = useState<ProvinceCode>("ON");

  const result = useMemo(
    () => calculateBonusTax({ province, baseSalary: salary, bonus }),
    [salary, bonus, province]
  );

  return (
    <div className="space-y-8">
      <div className="sfx-card p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <label className="sfx-label">Base annual salary</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  value={salary}
                  onChange={(e) => setSalary(Math.max(0, Number(e.target.value) || 0))}
                  className="sfx-input pl-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="sfx-label">Bonus amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  value={bonus}
                  onChange={(e) => setBonus(Math.max(0, Number(e.target.value) || 0))}
                  className="sfx-input pl-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="sfx-label">Province</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value as ProvinceCode)}
                className="sfx-select"
              >
                {ALL_PROVINCES.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="sfx-card">
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <h3 className="sfx-h3 mb-1">Bonus breakdown</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            How much of your bonus you keep after income tax, CPP/QPP and EI/QPIP at your
            marginal rate.
          </p>
        </div>
        <table className="sfx-table w-full text-sm">
          <tbody className="divide-y divide-[var(--color-border)]">
            <tr>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">Gross bonus</td>
              <td className="px-4 py-3 text-right tabular-nums money">
                {formatCurrency(result.bonusGross, { decimals: 2 })}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">Federal income tax</td>
              <td className="px-4 py-3 text-right tabular-nums text-[var(--color-danger)]">
                -{formatCurrency(result.bonusFederalTax, { decimals: 2 })}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">Provincial income tax</td>
              <td className="px-4 py-3 text-right tabular-nums text-[var(--color-danger)]">
                -{formatCurrency(result.bonusProvincialTax, { decimals: 2 })}
              </td>
            </tr>
            {result.bonusPension > 0 && (
              <tr>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                  CPP/QPP on bonus (remaining room)
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--color-danger)]">
                  -{formatCurrency(result.bonusPension, { decimals: 2 })}
                </td>
              </tr>
            )}
            {result.bonusEi > 0 && (
              <tr>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                  EI on bonus (remaining room)
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--color-danger)]">
                  -{formatCurrency(result.bonusEi, { decimals: 2 })}
                </td>
              </tr>
            )}
            {result.bonusProvincialPayrollTax > 0 && (
              <tr>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                  Provincial payroll tax
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--color-danger)]">
                  -{formatCurrency(result.bonusProvincialPayrollTax, { decimals: 2 })}
                </td>
              </tr>
            )}
            <tr className="font-semibold text-[var(--color-success)]">
              <td className="px-4 py-3">Net bonus</td>
              <td className="px-4 py-3 text-right tabular-nums money">
                {formatCurrency(result.bonusNet, { decimals: 2 })}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-[var(--color-text-secondary)] text-sm">
                Effective marginal rate on bonus
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text-muted)] text-sm">
                {formatPercent(result.effectiveMarginalRate, 1)}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-5 px-6 py-4 text-xs text-[var(--color-text-muted)] bg-[#F5F7FB] rounded-[var(--radius-md)] border border-[var(--color-border)]">
          Employers may withhold at a flat source-deduction rate during the year; actual tax is
          settled on your return at your marginal rate, which this estimate reflects.
        </p>
      </div>
    </div>
  );
}
