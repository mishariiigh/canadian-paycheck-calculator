import { buildMetadata } from "@/lib/seo";
import { TakeHomePayCalculator } from "@/components/calculators/take-home-pay-calculator";

export const metadata = buildMetadata({
  title: "Take-Home Pay Calculator 2026 — All Provinces",
  description:
    "Free Canadian take-home pay calculator for 2026. Estimate net salary after federal tax, provincial tax, CPP, CPP2 and EI for any province or territory.",
  path: "/calculators/take-home-pay",
  keywords: ["take home pay calculator canada", "net salary calculator", "paycheck calculator 2026"],
});

export default function TakeHomePayCalculatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Take-Home Pay Calculator (2026)</h1>
        <p className="mt-2 text-gray-600">
          Enter your gross annual salary to see estimated net pay after federal tax,
          provincial/territorial tax, CPP/QPP, CPP2/QPP2 and EI/QPIP.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Results show an estimated annual tax liability (T1-style) and average take-home pay per
          pay period. These are not actual payroll withholding amounts; actual deductions may differ
          due to CRA T4127 per-period payroll formulas, rounding, and individual circumstances.
        </p>
      </div>
      <TakeHomePayCalculator />
    </div>
  );
}
