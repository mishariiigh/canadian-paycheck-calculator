"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ALL_PROVINCES } from "@/engine/tax-data";
import type { ProvinceCode } from "@/engine/types";
import { hourlyToAnnualConversion } from "@/engine/salary-conversion";
import { calculateAnnualTax } from "@/engine/annual-tax";
import { formatCurrency, formatPercent } from "@/lib/formatting";

export function HourlyToSalaryCalculator() {
  const [hourly, setHourly] = useState(30);
  const [hours, setHours] = useState(40);
  const [weeks, setWeeks] = useState(52);
  const [province, setProvince] = useState<ProvinceCode>("ON");

  const conversion = useMemo(
    () => hourlyToAnnualConversion(hourly, hours, weeks),
    [hourly, hours, weeks]
  );

  const result = useMemo(
    () => calculateAnnualTax({ grossAnnualIncome: conversion.annualSalary, province, taxYear: 2026 }),
    [conversion.annualSalary, province]
  );

  return (
    <div className="space-y-8">
      <div className="sfx-card p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-1">
              <label className="sfx-label">Hourly rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={hourly}
                  onChange={(e) => setHourly(Math.max(0, Number(e.target.value) || 0))}
                  className="sfx-input pl-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="sfx-label">Hours per week</label>
              <input
                type="number"
                min={1}
                max={80}
                value={hours}
                onChange={(e) => setHours(Math.min(80, Math.max(1, Number(e.target.value) || 1)))}
                className="sfx-input"
              />
            </div>
            <div className="space-y-1">
              <label className="sfx-label">Weeks per year</label>
              <input
                type="number"
                min={1}
                max={52}
                value={weeks}
                onChange={(e) => setWeeks(Math.min(52, Math.max(1, Number(e.target.value) || 1)))}
                className="sfx-input"
              />
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
          <h3 className="sfx-h3 mb-1">Converted salary</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Gross and estimated take-home pay based on your hourly wage for 2026.
          </p>
        </div>
        <div className="px-6 pb-6">
          <div className="grid gap-3 sm:grid-cols-4 text-sm">
            <Stat label="Annual gross" value={formatCurrency(conversion.annualSalary)} />
            <Stat label="Monthly gross" value={formatCurrency(conversion.monthlyGross)} />
            <Stat label="Weekly gross" value={formatCurrency(conversion.weeklyGross)} />
            <Stat
              label="Annual net (est.)"
              value={formatCurrency(result.totals.netAnnualIncome)}
              positive
            />
          </div>
          <p className="mt-5 px-6 text-xs text-[var(--color-text-muted)]">
            Average deductions rate:{" "}
            <span className="font-semibold text-[var(--color-text-primary)]">
              {formatPercent(result.totals.averageTaxRate, 1)}
            </span>{" "}
            <Link
              href={`/take-home-pay/${province.toLowerCase()}/${Math.round(conversion.annualSalary)}`}
              className="sfx-link ml-1"
            >
              See the full breakdown →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)]">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
        {label}
      </p>
      <p className={`tabular-nums font-semibold ${positive ? "text-[var(--color-success)]" : "text-[var(--color-text-primary)]"}`}>
        {value}
      </p>
    </div>
  );
}
