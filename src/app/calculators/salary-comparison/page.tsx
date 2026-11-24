import { buildMetadata } from "@/lib/seo";
import { SalaryComparisonCalculator } from "@/components/calculators/salary-comparison-calculator";

export const metadata = buildMetadata({
  title: "Salary Comparison by Province (Canada, 2026)",
  description:
    "Compare take-home pay for the same salary across all 13 Canadian provinces and territories for the 2026 tax year.",
  path: "/calculators/salary-comparison",
  keywords: ["salary comparison provinces canada", "take home pay by province"],
});

export default function SalaryComparisonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Salary Comparison by Province</h1>
        <p className="mt-2 text-gray-600">See how the same gross salary converts to net pay across Canada.</p>
      </div>
      <SalaryComparisonCalculator />
    </div>
  );
}
