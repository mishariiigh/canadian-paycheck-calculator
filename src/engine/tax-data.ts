import federalJson from "../../data/2026/federal.json";
import payrollJson from "../../data/2026/payroll.json";
import abJson from "../../data/2026/provinces/AB.json";
import bcJson from "../../data/2026/provinces/BC.json";
import mbJson from "../../data/2026/provinces/MB.json";
import nbJson from "../../data/2026/provinces/NB.json";
import nlJson from "../../data/2026/provinces/NL.json";
import nsJson from "../../data/2026/provinces/NS.json";
import ntJson from "../../data/2026/provinces/NT.json";
import nuJson from "../../data/2026/provinces/NU.json";
import onJson from "../../data/2026/provinces/ON.json";
import peJson from "../../data/2026/provinces/PE.json";
import qcJson from "../../data/2026/provinces/QC.json";
import skJson from "../../data/2026/provinces/SK.json";
import ytJson from "../../data/2026/provinces/YT.json";
import type {
  FederalTaxData,
  PayrollData,
  ProvincialTaxData,
  ProvinceCode,
} from "./types";

/**
 * Tax data is bundled via static JSON imports so the engine works in both
 * server and client bundles (no node:fs). Files remain the single source of
 * truth under data/<year>/.
 */
const TAX_YEAR = 2026;

const provincial: Record<ProvinceCode, ProvincialTaxData> = {
  AB: abJson as ProvincialTaxData,
  BC: bcJson as ProvincialTaxData,
  MB: mbJson as ProvincialTaxData,
  NB: nbJson as ProvincialTaxData,
  NL: nlJson as ProvincialTaxData,
  NS: nsJson as ProvincialTaxData,
  NT: ntJson as ProvincialTaxData,
  NU: nuJson as ProvincialTaxData,
  ON: onJson as ProvincialTaxData,
  PE: peJson as ProvincialTaxData,
  QC: qcJson as ProvincialTaxData,
  SK: skJson as ProvincialTaxData,
  YT: ytJson as ProvincialTaxData,
};

export function getTaxYear(): number {
  return TAX_YEAR;
}

export function getFederalData(): FederalTaxData {
  return federalJson as FederalTaxData;
}

export function getPayrollData(): PayrollData {
  return payrollJson as PayrollData;
}

export function getProvincialData(province: ProvinceCode): ProvincialTaxData {
  const data = provincial[province];
  if (!data) throw new Error(`Unknown province: ${province}`);
  return data;
}

export const ALL_PROVINCES: { code: ProvinceCode; name: string }[] = (
  [
    ["AB", "Alberta"],
    ["BC", "British Columbia"],
    ["MB", "Manitoba"],
    ["NB", "New Brunswick"],
    ["NL", "Newfoundland and Labrador"],
    ["NS", "Nova Scotia"],
    ["NT", "Northwest Territories"],
    ["NU", "Nunavut"],
    ["ON", "Ontario"],
    ["PE", "Prince Edward Island"],
    ["QC", "Quebec"],
    ["SK", "Saskatchewan"],
    ["YT", "Yukon"],
  ] as [ProvinceCode, string][]
).map(([code, name]) => ({ code, name }));

export function getProvinceName(code: ProvinceCode): string {
  const found = ALL_PROVINCES.find((p) => p.code === code);
  return found ? found.name : code;
}

export function isProvinceCode(value: string): value is ProvinceCode {
  return ALL_PROVINCES.some((p) => p.code === value.toUpperCase());
}
