/**
 * Deterministic sample economic dataset.
 * Quarterly observations, 2010 Q1 – 2025 Q4 (64 periods), for three economies.
 * Values are illustrative but internally consistent: the inflation series is
 * generated from the other series, so a regression on it recovers real structure.
 */

export type Point = { period: string; value: number };

export type Category =
  | "Inflation"
  | "GDP"
  | "Employment"
  | "Interest Rates"
  | "Trade"
  | "Energy"
  | "Currency"
  | "Government"
  | "Monetary"
  | "Consumption"
  | "Labor"
  | "Financial Markets";

export type Indicator = {
  id: string;
  name: string;
  shortName: string;
  country: string;
  category: Category;
  unit: string;
  frequency: string;
  source: string;
  description: string;
  coverage: string;
  updated: string;
  series: Point[];
};

export const countries = ["Indonesia", "Hong Kong", "Singapore"] as const;
export type Country = (typeof countries)[number];

export const periods: string[] = Array.from({ length: 64 }, (_, i) => {
  const year = 2010 + Math.floor(i / 4);
  return `${year} Q${(i % 4) + 1}`;
});

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noise(r: () => number, scale: number) {
  return (r() - 0.5) * 2 * scale;
}

/** Simple mean-reverting series with an optional shock window. */
function ar1(seed: number, base: number, phi: number, sd: number, shocks: Record<number, number> = {}) {
  const r = rng(seed);
  let v = base;
  return periods.map((_, i) => {
    v = base + phi * (v - base) + noise(r, sd) + (shocks[i] ?? 0);
    return Math.round(v * 100) / 100;
  });
}

const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

const countryTune: Record<Country, { infl: number; gdp: number; unemp: number; rate: number; fx: number; fxUnit: string }> = {
  Indonesia: { infl: 3.4, gdp: 5.0, unemp: 5.4, rate: 5.5, fx: 14200, fxUnit: "IDR/USD" },
  "Hong Kong": { infl: 2.2, gdp: 2.6, unemp: 3.4, rate: 2.5, fx: 7.8, fxUnit: "HKD/USD" },
  Singapore: { infl: 1.9, gdp: 3.2, unemp: 2.3, rate: 1.9, fx: 1.35, fxUnit: "SGD/USD" },
};

// Global commodity series, shared across economies.
const oil = ar1(11, 74, 0.86, 7, { 6: -18, 7: -14, 40: -22, 41: -16, 48: 24, 49: 16, 50: 8 });

function buildCountry(country: Country, seedBase: number): Indicator[] {
  const t = countryTune[country];
  const covidGdp: Record<number, number> = { 41: -9 * (t.gdp / 5), 42: -4.5, 43: -2 };
  const covidUn: Record<number, number> = { 41: 1.4, 42: 1.1, 43: 0.7, 44: 0.4 };

  const gdp = ar1(seedBase + 1, t.gdp, 0.6, 0.45, covidGdp);
  const unemp = ar1(seedBase + 2, t.unemp, 0.85, 0.12, covidUn);
  const rate = ar1(seedBase + 3, t.rate, 0.92, 0.18, { 41: -0.8, 42: -0.5, 49: 0.9, 50: 0.8, 51: 0.5 });
  const bond = rate.map((v, i) => round(v + 1.1 + noise(rng(seedBase + 900 + i), 0.22)));
  const fx = ar1(seedBase + 4, t.fx, 0.95, t.fx * 0.012, { 41: t.fx * 0.02, 49: t.fx * 0.03 });
  const money = ar1(seedBase + 5, 8.4, 0.8, 0.9, { 42: 4.2, 43: 3.1 });
  const govt = ar1(seedBase + 6, 16.5, 0.88, 0.5, { 42: 2.4, 43: 1.6 });
  const exports = ar1(seedBase + 7, 4.8, 0.7, 1.6, { 41: -12, 42: -7, 48: 6 });
  const wages = ar1(seedBase + 8, 4.2, 0.85, 0.4, { 42: -1.6 });
  const consumption = ar1(seedBase + 9, 4.6, 0.75, 0.7, { 41: -8, 42: -4 });

  // Inflation is generated from the drivers above (plus noise) so the
  // regression engine has genuine structure to estimate.
  const rn = rng(seedBase + 77);
  const fx0 = t.fx;
  const infl = periods.map((_, i) =>
    round(
      t.infl -
        0.42 * (rate[i]! - t.rate) +
        0.045 * (oil[i]! - 74) +
        1.6 * ((fx[i]! - fx0) / fx0) * 10 +
        0.18 * (gdp[i]! - t.gdp) +
        0.22 * (money[i]! - 8.4) -
        0.3 * (unemp[i]! - t.unemp) +
        noise(rn, 0.45),
    ),
  );

  const slug = country.toLowerCase().replace(/\s+/g, "-");
  const mk = (
    id: string,
    name: string,
    shortName: string,
    category: Category,
    unit: string,
    source: string,
    description: string,
    values: number[],
  ): Indicator => ({
    id: `${slug}-${id}`,
    name,
    shortName,
    country,
    category,
    unit,
    frequency: "Quarterly",
    source,
    description,
    coverage: "2010 Q1 – 2025 Q4",
    updated: "Jan 2026",
    series: values.map((value, i) => ({ period: periods[i]!, value })),
  });

  return [
    mk("cpi", "CPI Inflation", "Inflation", "Inflation", "%", "World Bank / national statistics", "Year-on-year change in the consumer price index.", infl),
    mk("gdp", "GDP Growth", "GDP Growth", "GDP", "%", "World Bank", "Year-on-year real gross domestic product growth.", gdp),
    mk("unemployment", "Unemployment Rate", "Unemployment", "Employment", "%", "ILO / national statistics", "Share of the labour force without work and seeking employment.", unemp),
    mk("policy-rate", "Policy Interest Rate", "Interest Rate", "Interest Rates", "%", "FRED / central bank", "Headline policy rate set by the central bank.", rate),
    mk("bond-yield", "10Y Government Bond Yield", "Bond Yield", "Financial Markets", "%", "FRED", "Benchmark ten-year sovereign yield.", bond),
    mk("fx", "Exchange Rate", "Exchange Rate", "Currency", t.fxUnit, "FRED", "Period-average nominal exchange rate against the US dollar.", fx),
    mk("oil", "Oil Price (Brent)", "Oil Price", "Energy", "USD/barrel", "FRED", "Brent crude spot price, quarterly average.", oil),
    mk("money-supply", "Broad Money Growth", "Money Supply", "Monetary", "% YoY", "IMF IFS", "Year-on-year growth in broad money (M2).", money),
    mk("govt-spending", "Government Spending", "Govt Spending", "Government", "% of GDP", "IMF", "General government expenditure as a share of GDP.", govt),
    mk("exports", "Export Growth", "Exports", "Trade", "% YoY", "World Bank", "Year-on-year growth in merchandise exports.", exports),
    mk("wages", "Wage Growth", "Wage Growth", "Labor", "% YoY", "National statistics", "Year-on-year growth in average nominal wages.", wages),
    mk("consumption", "Consumer Spending", "Consumer Spending", "Consumption", "% YoY", "National statistics", "Year-on-year growth in household final consumption.", consumption),
  ];
}

export const indicators: Indicator[] = [
  ...buildCountry("Indonesia", 1000),
  ...buildCountry("Hong Kong", 2000),
  ...buildCountry("Singapore", 3000),
];

export const categories: Category[] = [
  "Inflation",
  "GDP",
  "Employment",
  "Interest Rates",
  "Monetary",
  "Trade",
  "Energy",
  "Currency",
  "Government",
  "Labor",
  "Consumption",
  "Financial Markets",
];

export function getIndicator(id: string) {
  return indicators.find((i) => i.id === id);
}

export function byCountry(country: string) {
  return indicators.filter((i) => i.country === country);
}

export function latest(ind: Indicator) {
  const s = ind.series;
  const last = s[s.length - 1]!;
  const prevYear = s[s.length - 5] ?? s[0]!;
  return {
    value: last.value,
    period: last.period,
    changeYoY: round(last.value - prevYear.value),
  };
}

export function formatValue(ind: Indicator, v: number) {
  if (ind.unit.includes("/USD") && Math.abs(v) > 100) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return v.toFixed(2);
}

export function sliceByYears(ind: Indicator, from: number, to: number) {
  return ind.series.filter((p) => {
    const y = Number(p.period.slice(0, 4));
    return y >= from && y <= to;
  });
}

export const popularTargets = [
  "indonesia-cpi",
  "indonesia-gdp",
  "indonesia-unemployment",
  "indonesia-fx",
  "indonesia-consumption",
  "indonesia-policy-rate",
];
