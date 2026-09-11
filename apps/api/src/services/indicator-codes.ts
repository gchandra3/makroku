/**
 * Mapping from frontend indicator IDs to World Bank series codes.
 * Each entry maps a suffix pattern (e.g. "cpi") to its WB code and metadata.
 *
 * Country prefixes are resolved at runtime:
 *   Indonesia  → "ID", "indonesia-"
 *   Hong Kong  → "HK", "hong-kong-"
 *   Singapore  → "SG", "singapore-"
 */

export type IndicatorMapping = {
  /** Suffix used in frontend IDs, e.g. "cpi" → "indonesia-cpi" */
  suffix: string;
  /** World Bank series code, e.g. "FP.CPI.TOTL.ZG" */
  wbCode: string;
  /** Display name */
  name: string;
  /** Short display name */
  shortName: string;
  /** Category from the frontend's Category union */
  category: string;
  /** Unit, e.g. "%", "USD", "% of GDP" */
  unit: string;
  /** Source label */
  source: string;
  /** Description for the detail view */
  description: string;
};

export type CountryMapping = {
  /** ISO 3166-1 alpha-2 country code for World Bank API */
  isoCode: string;
  /** Country display name */
  name: string;
  /** Slug used in frontend IDs, e.g. "indonesia", "hong-kong" */
  slug: string;
};

export const countryMappings: CountryMapping[] = [
  { isoCode: "ID", name: "Indonesia", slug: "indonesia" },
  { isoCode: "HK", name: "Hong Kong", slug: "hong-kong" },
  { isoCode: "SG", name: "Singapore", slug: "singapore" },
];

export const indicatorMappings: IndicatorMapping[] = [
  {
    suffix: "cpi",
    wbCode: "FP.CPI.TOTL.ZG",
    name: "CPI Inflation",
    shortName: "Inflation",
    category: "Inflation",
    unit: "%",
    source: "World Bank",
    description: "Year-on-year change in the consumer price index.",
  },
  {
    suffix: "gdp",
    wbCode: "NY.GDP.MKTP.KD.ZG",
    name: "GDP Growth",
    shortName: "GDP Growth",
    category: "GDP",
    unit: "%",
    source: "World Bank",
    description: "Year-on-year real gross domestic product growth.",
  },
  {
    suffix: "unemployment",
    wbCode: "SL.UEM.TOTL.ZS",
    name: "Unemployment Rate",
    shortName: "Unemployment",
    category: "Employment",
    unit: "%",
    source: "World Bank / ILO",
    description: "Share of the labour force without work and seeking employment.",
  },
  {
    suffix: "exports",
    wbCode: "NE.EXP.GNFS.KD.ZG",
    name: "Export Growth",
    shortName: "Exports",
    category: "Trade",
    unit: "% YoY",
    source: "World Bank",
    description: "Year-on-year growth in merchandise exports.",
  },
  {
    suffix: "fx",
    wbCode: "PA.NUS.FCRF",
    name: "Exchange Rate",
    shortName: "Exchange Rate",
    category: "Currency",
    unit: "LCU/USD",
    source: "World Bank",
    description: "Official exchange rate, local currency units per US dollar, period average.",
  },
  {
    suffix: "money-supply",
    wbCode: "FM.LBL.BMNY.ZG",
    name: "Broad Money Growth",
    shortName: "Money Supply",
    category: "Monetary",
    unit: "% YoY",
    source: "World Bank / IMF",
    description: "Year-on-year growth in broad money (M2).",
  },
  {
    suffix: "govt-spending",
    wbCode: "NE.CON.GOVT.ZS",
    name: "Government Spending",
    shortName: "Govt Spending",
    category: "Government",
    unit: "% of GDP",
    source: "World Bank",
    description: "General government final consumption expenditure as a share of GDP.",
  },
  {
    suffix: "consumption",
    wbCode: "NE.CON.PRVT.ZS",
    name: "Consumer Spending",
    shortName: "Consumer Spending",
    category: "Consumption",
    unit: "% of GDP",
    source: "World Bank",
    description: "Household final consumption expenditure as a share of GDP.",
  },
];

/**
 * Build a frontend indicator ID from country slug + indicator suffix.
 */
export function buildIndicatorId(countrySlug: string, suffix: string): string {
  return `${countrySlug}-${suffix}`;
}