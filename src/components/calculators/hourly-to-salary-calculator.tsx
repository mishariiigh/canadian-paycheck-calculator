"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ALL_PROVINCES } from "@/engine/tax-data";
import { hourlyToAnnualConversion } from "@/engine/salary-conversion";
import { calculateAnnualTax } from "@/engine/annual-tax";
import type { ProvinceCode } from "@/engine/types";
import { formatCurrency } from "@/lib/formatting";

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
    <div className="space-y-6">
      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Hourly rate ($)</span>
          <input type="number" min={0} value={hourly} onChange={(e) => setHourly(Math.max(0, Number(e.target.value)))} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Hours per week</span>
          <input type="number" min={1} max={80} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Weeks per year</span>
          <input type="number" min={1} max={52} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
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
        <h2 className="text-lg font-semibold">Converted salary</h2>
        <dl className="mt-3 grid gap-3 text-sm md:grid-cols-4">
          <div><dt className="text-gray-500">Annual gross</dt><dd className="text-lg font-semibold">{formatCurrency(conversion.annualSalary)}</dd></div>
          <div><dt className="text-gray-500">Monthly gross</dt><dd className="text-lg font-semibold">{formatCurrency(conversion.monthlyGross)}</dd></div>
          <div><dt className="text-gray-500">Weekly gross</dt><dd className="text-lg font-semibold">{formatCurrency(conversion.weeklyGross)}</dd></div>
          <div><dt className="text-gray-500">Annual net (est.)</dt><dd className="text-lg font-semibold text-green-700">{formatCurrency(result.totals.netAnnualIncome)}</dd></div>
        </dl>
        <p className="mt-4 text-sm text-gray-600">
          Average deductions rate: {(result.totals.averageTaxRate * 100).toFixed(1)}%.{" "}
          <Link href={`/take-home-pay/${province.toLowerCase()}/${Math.round(conversion.annualSalary)}`} className="text-blue-700 hover:underline">
            See the full breakdown →
          </Link>
        </p>
      </div>
    </div>
  );
}
