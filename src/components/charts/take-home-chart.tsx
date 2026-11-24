"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TaxCalculationResult } from "@/engine/types";
import { formatCurrency } from "@/lib/formatting";

export function TakeHomeBarChart({ result }: { result: TaxCalculationResult }) {
  const data = [
    { name: "Gross", value: result.grossAnnualIncome },
    {
      name: "Income tax",
      value: result.federal.effectiveAbatedTax + result.provincial.totalPayable,
    },
    { name: result.payroll.pensionName, value: result.payroll.pensionTotal },
    { name: result.payroll.eiName, value: result.payroll.ei },
    { name: "Net", value: result.totals.netAnnualIncome },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Where your gross pay goes</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
