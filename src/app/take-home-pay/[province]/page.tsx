import { notFound } from "next/navigation";
import Link from "next/link";
import { ALL_PROVINCES } from "@/engine/tax-data";
import { buildMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ province: string }>;
}

export function generateStaticParams() {
  return ALL_PROVINCES.map((p) => ({ province: p.code.toLowerCase() }));
}

export async function generateMetadata({ params }: Props) {
  const { province } = await params;
  const code = province.toUpperCase();
  if (!ALL_PROVINCES.some((p) => p.code === code)) return {};
  const name = ALL_PROVINCES.find((p) => p.code === code)!.name;
  return buildMetadata({
    title: `${name} Take-Home Pay Calculator 2026`,
    description: `Take-home pay calculator for ${name}: estimate net salary after tax, CPP/QPP, CPP2 and EI for the 2026 tax year.`,
    path: `/take-home-pay/${province}`,
  });
}

export default async function TakeHomePayProvinceIndex({ params }: Props) {
  const { province } = await params;
  const code = province.toUpperCase();
  if (!ALL_PROVINCES.some((p) => p.code === code)) notFound();
  const name = ALL_PROVINCES.find((p) => p.code === code)!.name;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{name} Take-Home Pay</h1>
      <p className="text-gray-600">Pick a salary to see a detailed net pay breakdown:</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 120000, 150000, 200000, 250000].map((s) => (
          <Link
            key={s}
            href={`/take-home-pay/${province.toLowerCase()}/${s}`}
            className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm hover:border-blue-400"
          >
            ${s.toLocaleString("en-CA")}
          </Link>
        ))}
      </div>
    </div>
  );
}
