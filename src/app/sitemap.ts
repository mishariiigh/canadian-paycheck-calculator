import type { MetadataRoute } from "next";
import { ALL_PROVINCES } from "@/engine/tax-data";
import { SITE_URL, takeHomePayUrl } from "@/lib/seo";

const SALARIES = [30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 120000, 150000, 200000, 250000];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const now = new Date();

  const staticRoutes = ["", "/calculators", "/calculators/take-home-pay", "/calculators/hourly-to-salary", "/calculators/bonus-tax", "/calculators/salary-comparison", "/job-offer-comparison"].map(
    (path) => ({ url: `${base}${path}`, lastModified: now, changeFrequency: "monthly" as const, priority: path === "" ? 1 : 0.8 })
  );

  const provinceRoutes = ALL_PROVINCES.map((p) => ({
    url: `${base}/province/${p.code.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  const salaryRoutes = ALL_PROVINCES.flatMap((p) =>
    SALARIES.map((s) => ({
      url: `${base}${takeHomePayUrl(p.code, s)}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    }))
  );

  return [...staticRoutes, ...provinceRoutes, ...salaryRoutes];
}
