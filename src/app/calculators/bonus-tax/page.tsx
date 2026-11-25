import { buildMetadata } from "@/lib/seo";
import { BonusTaxCalculator } from "@/components/calculators/bonus-tax-calculator";

export const metadata = buildMetadata({
  title: "Bonus Tax Calculator (Canada, 2026)",
  description:
    "Estimate how much tax you pay on a work bonus in Canada — federal and provincial tax, CPP and EI on the bonus — for any province.",
  path: "/calculators/bonus-tax",
  keywords: ["bonus tax calculator canada", "how is bonus taxed canada"],
});

export default function BonusTaxPage() {
  return (
    <div className="space-y-6">
      <div className="sfx-card p-6 md:p-8">
        <h1 className="sfx-h2 mb-3">Bonus Tax Calculator</h1>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          See how much of your bonus you keep after deductions.
        </p>
      </div>
      <BonusTaxCalculator />
    </div>
  );
}
