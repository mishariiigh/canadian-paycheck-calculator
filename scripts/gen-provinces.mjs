#!/usr/bin/env node
/**
 * One-off generator for data/2026/provinces/*.json
 * Values sourced & verified Nov 2026; see docs/DATA-VALIDATION-REPORT.md.
 * Run: node scripts/gen-provinces.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";

const year = 2026;
const eff = "2026-01-01";
const verified = "2026-11-24";
const provinces = [
  {
    code: "ON",
    name: "Ontario",
    creditRate: 0.0505,
    bpa: 12989,
    brackets: [
      [53891, 0.0505],
      [107785, 0.0915],
      [150000, 0.1116],
      [220000, 0.1216],
      [null, 0.1316],
    ],
    indexation: 1.019,
    surtax: {
      tiers: [
        { rate: 0.2, onTaxOver: 5818 },
        { rate: 0.36, onTaxOver: 7446 },
      ],
    },
    healthPremium: {
      bands: [
        { upTo: 20000, amount: 0 },
        { upTo: 25000, amount: null, base: 0, rate: 0.06, over: 20000 },
        { upTo: 36000, amount: 300 },
        { upTo: 38500, amount: null, base: 300, rate: 0.06, over: 36000 },
        { upTo: 48000, amount: 450 },
        { upTo: 48600, amount: null, base: 450, rate: 0.25, over: 48000 },
        { upTo: 72000, amount: 600 },
        { upTo: 72600, amount: null, base: 600, rate: 0.25, over: 72000 },
        { upTo: 200000, amount: 750 },
        { upTo: 200600, amount: null, base: 750, rate: 0.25, over: 200000 },
        { upTo: null, amount: 900 },
      ],
    },
    extraSources: [
      "https://www.taxtips.ca/ontax/ontario-health-premium.htm",
      "https://www.ontario.ca/page/health-premium",
    ],
  },
  {
    code: "AB",
    name: "Alberta",
    creditRate: 0.08,
    bpa: 22769,
    brackets: [
      [61200, 0.08],
      [154259, 0.10],
      [185111, 0.12],
      [246813, 0.13],
      [370220, 0.14],
      [null, 0.15],
    ],
    indexation: 1.02,
    notes: ["Indexation capped at 2% by Alberta Bill 32 (2024)."],
  },
  {
    code: "BC",
    name: "British Columbia",
    creditRate: 0.056,
    bpa: 13216,
    brackets: [
      [50363, 0.056],
      [100728, 0.077],
      [115648, 0.105],
      [140430, 0.1229],
      [190405, 0.147],
      [265545, 0.168],
      [null, 0.205],
    ],
    indexation: null,
    notes: ["Lowest bracket rate raised from 5.06% to 5.60% for 2026 by BC 2026 Budget; no 2026 indexation."],
  },
  {
    code: "MB",
    name: "Manitoba",
    creditRate: 0.108,
    bpa: 15780,
    brackets: [
      [47000, 0.108],
      [100000, 0.1275],
      [null, 0.174],
    ],
    indexation: null,
    notes: ["Indexation frozen at 2024 levels (Budget 2025); BPA not increased for 2026."],
  },
  {
    code: "NB",
    name: "New Brunswick",
    creditRate: 0.094,
    bpa: 13664,
    brackets: [
      [52333, 0.094],
      [104666, 0.14],
      [193861, 0.16],
      [null, 0.195],
    ],
    indexation: 1.02,
  },
  {
    code: "NL",
    name: "Newfoundland and Labrador",
    creditRate: 0.087,
    bpa: 13194,
    brackets: [
      [44678, 0.087],
      [89354, 0.145],
      [159528, 0.158],
      [223340, 0.178],
      [285319, 0.198],
      [570638, 0.208],
      [1141275, 0.213],
      [null, 0.218],
    ],
    indexation: 1.033,
    notes: ["NL 2026 Budget raised the basic personal amount to $15,000; the indexed 2026 BPA per TaxTips.ca is $13,094 before the budget measure. Using $15,000 per NL Budget 2026 highlight."],
    bpaOverride: 15000,
  },
  {
    code: "NS",
    name: "Nova Scotia",
    creditRate: 0.0879,
    bpa: 11932,
    brackets: [
      [30995, 0.0879],
      [61991, 0.1495],
      [97417, 0.1667],
      [157124, 0.175],
      [null, 0.21],
    ],
    indexation: 1.016,
    notes: ["NS indexes using 12-month CPI average ending August (2026 factor 1.016); most personal tax credits not indexed."],
  },
  {
    code: "NT",
    name: "Northwest Territories",
    creditRate: 0.059,
    bpa: 18198,
    brackets: [
      [53003, 0.059],
      [106009, 0.086],
      [172346, 0.122],
      [null, 0.1405],
    ],
    indexation: 1.02,
    payrollTax: { type: "employee", rate: 0.02, basis: "grossEmploymentIncome", note: "2% NWT Payroll Tax withheld from employee gross pay (NWT Payroll Tax Act)." },
  },
  {
    code: "NU",
    name: "Nunavut",
    creditRate: 0.04,
    bpa: 19659,
    brackets: [
      [55801, 0.04],
      [111602, 0.07],
      [181439, 0.09],
      [null, 0.115],
    ],
    indexation: 1.02,
    payrollTax: { type: "employee", rate: 0.02, basis: "grossEmploymentIncome", note: "2% Nunavut payroll tax withheld from employee gross pay." },
  },
  {
    code: "PE",
    name: "Prince Edward Island",
    creditRate: 0.095,
    bpa: 15000,
    brackets: [
      [33928, 0.095],
      [65820, 0.1347],
      [106890, 0.166],
      [142520, 0.1762],
      [200000, 0.19],
      [null, 0.20],
    ],
    indexation: null,
    notes: ["PEI does not index brackets. New top bracket 20% over $200,000 effective January 1, 2026."],
  },
  {
    code: "QC",
    name: "Quebec",
    creditRate: 0.14,
    bpa: 18952,
    brackets: [
      [54345, 0.14],
      [108680, 0.19],
      [132245, 0.24],
      [null, 0.2575],
    ],
    indexation: 1.0205,
    federalAbatement: { rate: 0.165, note: "Quebec residents' federal tax is reduced by 16.5% of basic federal tax (abatement)." },
    extraSources: ["https://www.revenuquebec.ca/en/citizens/income-tax-return/completing-your-income-tax-return/income-tax-rates/"],
  },
  {
    code: "SK",
    name: "Saskatchewan",
    creditRate: 0.105,
    bpa: 20381,
    brackets: [
      [54532, 0.105],
      [155805, 0.125],
      [null, 0.145],
    ],
    indexation: 1.02,
  },
  {
    code: "YT",
    name: "Yukon",
    creditRate: 0.064,
    bpa: 16452,
    brackets: [
      [58523, 0.064],
      [117045, 0.09],
      [181440, 0.109],
      [500000, 0.128],
      [null, 0.15],
    ],
    indexation: 1.02,
    notes: ["YT mirrors federal brackets/BPA structure; YT BPA enhanced like federal (max $16,452 for net income <= 181,440)."],
  },
];

const dir = "data/2026/provinces";
mkdirSync(dir, { recursive: true });

for (const p of provinces) {
  const data = {
    taxYear: year,
    province: p.code,
    provinceName: p.name,
    effectiveDate: eff,
    lastVerified: verified,
    sources: [
      {
        name: `TaxTips.ca — ${p.name} ${year} Tax Rates & Tax Brackets (confirmed to CRA information)`,
        url: `https://www.taxtips.ca/taxrates/${p.code.toLowerCase()}.htm`,
      },
    ],
    taxBrackets: p.brackets.map(([upTo, rate]) => ({ upTo, rate })),
    basicPersonalAmount: { amount: p.bpaOverride ?? p.bpa, creditRate: p.creditRate },
    indexationFactor: p.indexation,
  };
  if (p.notes) data.notes = p.notes;
  if (p.surtax) data.surtax = p.surtax;
  if (p.healthPremium) data.healthPremium = p.healthPremium;
  if (p.federalAbatement) data.federalAbatement = p.federalAbatement;
  if (p.payrollTax) data.payrollTax = p.payrollTax;
  if (p.extraSources) data.sources.push({ name: "Additional source", url: p.extraSources.join(" ; ") });
  writeFileSync(`${dir}/${p.code}.json`, JSON.stringify(data, null, 2) + "\n");
  console.log(`wrote ${dir}/${p.code}.json`);
}
