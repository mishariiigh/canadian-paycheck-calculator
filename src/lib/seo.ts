import type { ProvinceCode } from "@/engine/types";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://canadatakehome.example.com";
export const SITE_NAME = "Canada Take-Home Pay Calculators";

export function provinceSlug(code: ProvinceCode): string {
  return code.toLowerCase();
}

export function salarySlug(salary: number): string {
  return String(Math.round(salary));
}

export function takeHomePayUrl(province: ProvinceCode, salary: number): string {
  return `/take-home-pay/${provinceSlug(province)}/${salarySlug(salary)}`;
}

export function provincePageUrl(code: ProvinceCode): string {
  return `/province/${provinceSlug(code)}`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

export interface SeoMetadataInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}

export function buildMetadata(input: SeoMetadataInput) {
  return {
    title: pageTitle(input.title),
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: absoluteUrl(input.path) },
    openGraph: {
      title: pageTitle(input.title),
      description: input.description,
      url: absoluteUrl(input.path),
      siteName: SITE_NAME,
      type: "website" as const,
      locale: "en_CA",
    },
    twitter: {
      card: "summary_large_image" as const,
      title: pageTitle(input.title),
      description: input.description,
    },
  };
}
