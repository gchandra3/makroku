export type Point = { period: string; value: number };

export type Indicator = {
  id: string;
  name: string;
  country: string;
  category: "Inflation" | "GDP" | "Employment" | "Interest rates";
  unit: string;
  value: number;
  change: number;
  previous: number;
  forecast: number;
  frequency: string;
  source: string;
  updated: string;
  observations: number;
  period: string;
  series: Point[];
};

function series(start: number, steps: number[], from = 2016.0, stepYears = 0.25): Point[] {
  let v = start;
  return steps.map((d, i) => {
    v = Math.round((v + d) * 100) / 100;
    const y = from + i * stepYears;
    const year = Math.floor(y);
    const q = Math.round((y - year) / 0.25) + 1;
    return { period: stepYears === 1 ? `${year}` : `${year} Q${q}`, value: v };
  });
}

const gdpSteps = [
  0, 0.03, -0.05, 0.06, 0.02, -0.04, 0.05, 0.01, -0.02, 0.04, -0.03, 0.02, -0.3, -6.4, 1.2,
  1.4, 2.1, 1.3, 0.4, 0.2, -0.1, 0.15, 0.1, -0.05, 0.12, -0.08, 0.06, 0.1, -0.04, 0.08,
  0.05, -0.02, 0.06, 0.03, -0.05, 0.07, 0.02, 0.04, -0.03, 0.05, 0.02, 0.03,
];

const cpiSteps = [
  0, -0.2, -0.3, -0.1, 0.4, 0.2, -0.1, -0.3, 0.1, 0.2, -0.2, -0.1, -0.4, -0.5, -0.3, 0.1,
  0.2, 0.3, 0.4, 0.6, 0.9, 1.1, 0.6, -0.4, -0.7, -0.6, -0.5, -0.3, -0.2, -0.1, 0.1, -0.2,
  -0.1, 0.05, -0.1, 0.1, -0.05, -0.1, 0.05, -0.05, -0.1, -0.05,
];

const unempSteps = [
  0, -0.05, -0.1, 0.05, -0.08, -0.06, -0.04, 0.02, -0.05, -0.03, -0.04, 0.01, 0.6, 1.4, 0.3,
  -0.2, -0.3, -0.25, -0.2, -0.15, -0.1, -0.12, -0.08, -0.05, -0.06, -0.04, -0.05, -0.03,
  -0.04, -0.02, -0.03, -0.02, -0.03, -0.01, -0.02, -0.01, -0.02, -0.01, -0.01, -0.01, 0,
  -0.01,
];

const rateSteps = [
  0, -0.25, -0.25, -0.25, 0, -0.25, 0, 0, 0.25, 0.25, 0, 0, -0.25, -0.75, -0.5, -0.25, 0, 0,
  0, 0, 0, 0.25, 0.75, 0.75, 0.5, 0.25, 0, 0.25, 0, 0, 0, 0.25, 0, 0, -0.25, 0, -0.25, 0, 0,
  -0.25, 0, 0,
];

export const indicators: Indicator[] = [
  {
    id: "id-gdp-growth",
    name: "Indonesia GDP Growth",
    country: "Indonesia",
    category: "GDP",
    unit: "%",
    value: 5.1,
    change: 0.3,
    previous: 4.95,
    forecast: 5.2,
    frequency: "Quarterly",
    source: "World Bank",
    updated: "Aug 2026",
    observations: 168,
    period: "1984 Q1 – 2026 Q2",
    series: series(5.02, gdpSteps),
  },
  {
    id: "id-cpi",
    name: "Indonesia CPI Inflation",
    country: "Indonesia",
    category: "Inflation",
    unit: "%",
    value: 2.8,
    change: -0.1,
    previous: 2.9,
    forecast: 2.7,
    frequency: "Monthly",
    source: "FRED",
    updated: "Aug 2026",
    observations: 402,
    period: "1993 M1 – 2026 M7",
    series: series(3.45, cpiSteps),
  },
  {
    id: "id-unemployment",
    name: "Indonesia Unemployment Rate",
    country: "Indonesia",
    category: "Employment",
    unit: "%",
    value: 4.9,
    change: -0.2,
    previous: 5.1,
    forecast: 4.8,
    frequency: "Quarterly",
    source: "World Bank",
    updated: "Jul 2026",
    observations: 122,
    period: "1996 Q1 – 2026 Q2",
    series: series(5.6, unempSteps),
  },
  {
    id: "id-policy-rate",
    name: "Bank Indonesia Policy Rate",
    country: "Indonesia",
    category: "Interest rates",
    unit: "%",
    value: 5.75,
    change: -0.25,
    previous: 6.0,
    forecast: 5.5,
    frequency: "Monthly",
    source: "FRED",
    updated: "Aug 2026",
    observations: 246,
    period: "2005 M7 – 2026 M8",
    series: series(7.0, rateSteps),
  },
  {
    id: "hk-cpi",
    name: "Hong Kong CPI Inflation",
    country: "Hong Kong",
    category: "Inflation",
    unit: "%",
    value: 1.9,
    change: 0.1,
    previous: 1.8,
    forecast: 2.0,
    frequency: "Monthly",
    source: "HK Census & Statistics Department",
    updated: "Aug 2026",
    observations: 366,
    period: "1996 M1 – 2026 M7",
    series: series(2.6, cpiSteps.map((s) => s * 0.6)),
  },
  {
    id: "hk-gdp-growth",
    name: "Hong Kong GDP Growth",
    country: "Hong Kong",
    category: "GDP",
    unit: "%",
    value: 2.6,
    change: -0.4,
    previous: 3.0,
    forecast: 2.4,
    frequency: "Quarterly",
    source: "HK Census & Statistics Department",
    updated: "Aug 2026",
    observations: 140,
    period: "1991 Q1 – 2026 Q2",
    series: series(2.4, gdpSteps.map((s) => s * 0.8)),
  },
  {
    id: "sg-cpi",
    name: "Singapore CPI Inflation",
    country: "Singapore",
    category: "Inflation",
    unit: "%",
    value: 1.4,
    change: -0.2,
    previous: 1.6,
    forecast: 1.3,
    frequency: "Monthly",
    source: "FRED",
    updated: "Aug 2026",
    observations: 390,
    period: "1994 M1 – 2026 M7",
    series: series(2.1, cpiSteps.map((s) => s * 0.5)),
  },
  {
    id: "sg-unemployment",
    name: "Singapore Unemployment Rate",
    country: "Singapore",
    category: "Employment",
    unit: "%",
    value: 2.0,
    change: -0.1,
    previous: 2.1,
    forecast: 2.0,
    frequency: "Quarterly",
    source: "World Bank",
    updated: "Jul 2026",
    observations: 118,
    period: "1997 Q1 – 2026 Q2",
    series: series(2.6, unempSteps.map((s) => s * 0.45)),
  },
  {
    id: "global-rate",
    name: "US Federal Funds Rate",
    country: "Global",
    category: "Interest rates",
    unit: "%",
    value: 3.75,
    change: -0.25,
    previous: 4.0,
    forecast: 3.5,
    frequency: "Monthly",
    source: "FRED",
    updated: "Aug 2026",
    observations: 858,
    period: "1954 M7 – 2026 M8",
    series: series(4.9, rateSteps.map((s) => s * 0.9)),
  },
  {
    id: "global-growth",
    name: "World GDP Growth",
    country: "Global",
    category: "GDP",
    unit: "%",
    value: 3.0,
    change: 0.1,
    previous: 2.9,
    forecast: 3.1,
    frequency: "Annual",
    source: "World Bank",
    updated: "Jun 2026",
    observations: 66,
    period: "1961 – 2026",
    series: series(2.8, gdpSteps.map((s) => s * 0.7)),
  },
];

// Align each series so the final observation matches the headline value.
for (const ind of indicators) {
  const last = ind.series[ind.series.length - 1]!.value;
  const shift = ind.value - last;
  ind.series = ind.series.map((p) => ({
    period: p.period,
    value: Math.round((p.value + shift) * 100) / 100,
  }));
}

export const countries = ["Indonesia", "Hong Kong", "Singapore", "Global"] as const;

export function getIndicator(id: string) {
  return indicators.find((i) => i.id === id);
}

export const popularIds = ["id-gdp-growth", "id-cpi", "id-unemployment", "id-policy-rate"];
export const recentIds = ["hk-cpi", "id-gdp-growth", "global-rate"];

export type ModelKey = "naive" | "arima" | "sarima" | "regression";

export const models: {
  key: ModelKey;
  name: string;
  blurb: string;
  mae: number;
  rmse: number;
  accuracy: number;
  point: number;
}[] = [
  {
    key: "naive",
    name: "Naive",
    blurb: "Assumes next quarter equals the last observed value.",
    mae: 0.82,
    rmse: 1.01,
    accuracy: 77,
    point: 5.0,
  },
  {
    key: "arima",
    name: "ARIMA",
    blurb: "Learns from the series' own momentum and past errors.",
    mae: 0.67,
    rmse: 0.84,
    accuracy: 82,
    point: 5.1,
  },
  {
    key: "sarima",
    name: "SARIMA",
    blurb: "ARIMA plus a repeating seasonal quarterly pattern.",
    mae: 0.61,
    rmse: 0.79,
    accuracy: 84,
    point: 5.15,
  },
  {
    key: "regression",
    name: "Regression",
    blurb: "Uses inflation, rates and trade as extra predictors.",
    mae: 0.54,
    rmse: 0.71,
    accuracy: 86,
    point: 5.2,
  },
];

export const dataSources = [
  {
    name: "World Bank",
    detail: "World Development Indicators",
    frequency: "Annual / Quarterly",
    period: "1960 – 2026",
    updated: "12 Aug 2026",
    observations: "1,482",
  },
  {
    name: "FRED",
    detail: "Federal Reserve Bank of St. Louis",
    frequency: "Monthly",
    period: "1954 – 2026",
    updated: "21 Aug 2026",
    observations: "3,096",
  },
  {
    name: "Hong Kong Census & Statistics Department",
    detail: "Consumer price & national accounts",
    frequency: "Monthly / Quarterly",
    period: "1991 – 2026",
    updated: "18 Aug 2026",
    observations: "874",
  },
];

export function buildForecast(indicator: Indicator, point: number, horizon: number) {
  const hist = indicator.series.slice(-24);
  const last = hist[hist.length - 1]!;
  const lastYear = parseInt(last.period.slice(0, 4), 10);
  const lastQ = parseInt(last.period.slice(-1), 10) || 4;

  const rows: {
    period: string;
    actual: number | null;
    forecast: number | null;
    lower: number | null;
    upper: number | null;
    band: [number, number] | null;
  }[] = hist.map((p) => ({
    period: p.period,
    actual: p.value,
    forecast: null,
    lower: null,
    upper: null,
    band: null,
  }));

  rows[rows.length - 1]!.forecast = last.value;
  rows[rows.length - 1]!.band = [last.value, last.value];

  for (let i = 1; i <= horizon; i++) {
    const q = ((lastQ - 1 + i) % 4) + 1;
    const y = lastYear + Math.floor((lastQ - 1 + i) / 4);
    const drift = (point - last.value) * (i / horizon);
    const v = Math.round((last.value + drift) * 100) / 100;
    const w = Math.round(0.28 * Math.sqrt(i) * 100) / 100;
    rows.push({
      period: `${y} Q${q}`,
      actual: null,
      forecast: v,
      lower: Math.round((v - w) * 100) / 100,
      upper: Math.round((v + w) * 100) / 100,
      band: [Math.round((v - w) * 100) / 100, Math.round((v + w) * 100) / 100],
    });
  }
  return { rows, divider: last.period };
}
