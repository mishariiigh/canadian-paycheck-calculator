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
    { name: "Gross pay", value: result.grossAnnualIncome, color: "#17243A" },
    {
      name: "Income tax",
      value: result.federal.effectiveAbatedTax + result.provincial.totalPayable,
      color: "#D92736",
    },
    { name: result.payroll.pensionName, value: result.payroll.pensionTotal, color: "#64748B" },
    { name: result.payroll.eiName, value: result.payroll.ei, color: "#94A3B8" },
    { name: "Net pay", value: result.totals.netAnnualIncome, color: "#16A36A" },
  ];

  return (
    <div className="sfx-card">
      <div className="px-6 py-5 border-b border-[var(--color-border)]">
        <h3 className="sfx-h3 mb-1">Where your gross pay goes</h3>
        <p className="text-xs text-[var(--color-text-muted)]">
          Annual breakdown of gross pay into tax, deductions and net pay.
        </p>
      </div>
      <div className="px-2 pb-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF1" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
              tick={{ fontSize: 12, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
              hide
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              wrapperStyle={{ outline: "none", boxShadow: "var(--shadow-md)" }}
              contentStyle={{ border: "1px solid #E5EAF1", borderRadius: "8px", background: "#FFFFFF" }}
              itemStyle={{ color: "#263449", fontSize: 13, marginBottom: 4 }}
              labelStyle={{ color: "#64748B", fontSize: 12, fontWeight: 600 }}
            />
            {data.map((bar) => (
              <Bar key={bar.name} dataKey="value" radius={[6, 6, 0, 0]} fill={bar.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
