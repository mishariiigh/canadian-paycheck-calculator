import Image from "next/image";
import Link from "next/link";
import { ALL_PROVINCES } from "@/engine/tax-data";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <Image
            src="/images/canada-maple-leaf.png"
            alt="Canadian maple leaf"
            width={40}
            height={40}
            className="object-contain"
          />
          Canada Take-Home Pay
        </Link>
        <nav className="flex gap-4 text-sm text-gray-600">
          <Link href="/calculators" className="hover:text-blue-700">Calculators</Link>
          <Link href="/province/on" className="hover:text-blue-700">Ontario</Link>
          <Link href="/take-home-pay/on/80000" className="hover:text-blue-700">$80K Example</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-600">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Calculators</h3>
            <ul className="space-y-1">
              <li><Link href="/calculators/take-home-pay" className="hover:underline">Take-Home Pay Calculator</Link></li>
              <li><Link href="/calculators/hourly-to-salary" className="hover:underline">Hourly to Salary</Link></li>
              <li><Link href="/calculators/bonus-tax" className="hover:underline">Bonus Tax Calculator</Link></li>
              <li><Link href="/calculators/salary-comparison" className="hover:underline">Salary Comparison</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Provinces &amp; Territories</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
              {ALL_PROVINCES.map((p) => (
                <li key={p.code}>
                  <Link href={`/province/${p.code.toLowerCase()}`} className="hover:underline">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-gray-900">About</h3>
            <p>
              Estimates for the 2026 tax year based on rates published by the CRA and
              provincial governments. Not tax advice.
            </p>
          </div>
        </div>
        <p className="mt-6 text-xs text-gray-500">
          © {new Date().getFullYear()} Canada Take-Home Pay Calculators. Informational use only —
          verify with a qualified professional before making financial decisions.
        </p>
      </div>
    </footer>
  );
}
