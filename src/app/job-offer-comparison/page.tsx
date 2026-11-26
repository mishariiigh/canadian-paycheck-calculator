import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { JobOfferComparison } from "@/components/job-offer-comparison/job-offer-comparison";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Job Offer Comparison Studio — Compare 2–3 Canadian Offers Net of Tax",
    description:
      "Compare up to three Canadian job offers side by side: estimated net pay after federal and provincial tax, CPP/QPP, CPP2 and EI/QPIP, bonuses, employer pension and work expenses. Free, no registration.",
    path: "/job-offer-comparison",
    keywords: [
      "job offer comparison canada",
      "compare job offers after tax",
      "salary comparison tool",
      "total compensation comparison",
      "net pay comparison calculator",
    ],
  }),
};

export default function JobOfferComparisonPage() {
  return (
    <div className="space-y-6">
      <div className="sfx-card p-6 md:p-8">
        <p className="sfx-kicker mb-2">Job Offer Comparison Studio</p>
        <h1 className="sfx-h2 mb-3">Compare Canadian job offers on what you actually keep</h1>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-3xl">
          Enter up to three offers and see estimated annual, monthly and bi-weekly take-home pay
          after federal and provincial/territorial tax, CPP/QPP (including CPP2/QPP2) and EI/QPIP —
          plus how bonuses, employer pension, other benefits and work-related expenses change the
          real financial picture.
        </p>
        <p className="mt-3 text-xs text-[var(--color-text-muted)] leading-relaxed max-w-3xl">
          Everything runs in your browser. No account, no storage of your figures, nothing sent to
          analytics except anonymous feature usage. Estimates for the current tax year based on
          CRA and provincial published parameters — not tax advice.
        </p>
      </div>

      <JobOfferComparison />

      <section className="sfx-card p-6 md:p-8">
        <h2 className="sfx-h3 mb-3">How this differs from a simple salary comparison</h2>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          Our{" "}
          <Link href="/calculators/salary-comparison" className="sfx-link">
            salary comparison by province
          </Link>{" "}
          compares one salary across all provinces. This studio is for choosing between{" "}
          <em>offers</em>: different employers, different provinces, bonuses, signing incentives,
          employer pension contributions and the everyday costs a job creates. For a single
          detailed offer, use the{" "}
          <Link href="/calculators/take-home-pay" className="sfx-link">
            take-home pay calculator
          </Link>{" "}
          or the{" "}
          <Link href="/calculators/bonus-tax" className="sfx-link">
            bonus tax calculator
          </Link>
          . Converting an hourly wage first? Start with the{" "}
          <Link href="/calculators/hourly-to-salary" className="sfx-link">
            hourly to salary converter
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
