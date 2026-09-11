/**
 * Indicator service — fetches World Bank data, interpolates annual → quarterly,
 * transforms to the frontend Indicator shape, caches in Redis, persists to SQLite.
 */
import { cache, generateCacheKey, CacheTTL } from "../cache";
import { fetchIndicator } from "../clients/world-bank";
import {
  countryMappings,
  indicatorMappings,
  buildIndicatorId,
} from "./indicator-codes";
import {
  upsertSeries,
  upsertPoints,
  findSeriesByCode,
  findPointsBySeriesId,
  listAllSeries,
  getDataSourceId,
} from "../data-access/indicator.repository";

/* ---------- frontend-compatible types ---------- */

export type Point = { period: string; value: number };

export type Indicator = {
  id: string;
  name: string;
  shortName: string;
  country: string;
  category: string;
  unit: string;
  frequency: string;
  source: string;
  description: string;
  coverage: string;
  updated: string;
  series: Point[];
};

/* ---------- annual → quarterly interpolation ---------- */

/**
 * Monotone cubic Hermite spline (Fritsch-Carlson).
 * Treats each annual value as the year's midpoint, then interpolates
 * quarterly points between adjacent years.
 */
function interpolateAnnualToQuarterly(
  annual: { year: number; value: number }[],
  fromYear: number,
  toYear: number,
): Point[] {
  if (annual.length < 2) return [];

  const yearMap = new Map(annual.map((d) => [d.year, d.value]));
  const years = annual.map((d) => d.year).sort((a, b) => a - b);
  const firstYear = years[0]!;
  const lastYear = years[years.length - 1]!;

  // Compute Fritsch-Carlson monotone slopes
  const slopes = new Map<number, number>();
  for (let i = 0; i < years.length; i++) {
    const y = years[i]!;
    const v = yearMap.get(y)!;

    if (i === 0) {
      const next = years[i + 1]!;
      const s = (yearMap.get(next)! - v) / (next - y);
      slopes.set(y, s);
    } else if (i === years.length - 1) {
      const prev = years[i - 1]!;
      const s = (v - yearMap.get(prev)!) / (y - prev);
      slopes.set(y, s);
    } else {
      const prev = years[i - 1]!;
      const next = years[i + 1]!;
      const leftS = (v - yearMap.get(prev)!) / (y - prev);
      const rightS = (yearMap.get(next)! - v) / (next - y);
      if (leftS * rightS <= 0) {
        slopes.set(y, 0);
      } else {
        const central = (leftS + rightS) / 2;
        const alpha = Math.min(1, (3 * Math.abs(central)) / (Math.abs(leftS) + Math.abs(rightS)));
        slopes.set(y, alpha * central);
      }
    }
  }

  const result: Point[] = [];

  for (let year = fromYear; year <= toYear; year++) {
    for (const q of ["Q1", "Q2", "Q3", "Q4"] as const) {
      // Q1=0.125, Q2=0.375, Q3=0.625, Q4=0.875 as fraction through the year
      const frac = { Q1: 0.125, Q2: 0.375, Q3: 0.625, Q4: 0.875 }[q];

      // Segment: Q1/Q2 lie between year-1 and year; Q3/Q4 between year and year+1
      let x0: number, x1: number, y0: number, y1: number, m0: number, m1: number;

      if (q === "Q1" || q === "Q2") {
        x0 = year - 1;
        x1 = year;
      } else {
        x0 = year;
        x1 = year + 1;
      }

      y0 = lookupOrClamp(yearMap, years, x0, firstYear, lastYear);
      y1 = lookupOrClamp(yearMap, years, x1, firstYear, lastYear);
      m0 = slopes.get(x0) ?? 0;
      m1 = slopes.get(x1) ?? 0;

      const x = x0 + frac * (x1 - x0);
      const val = hermite(x0, y0, x1, y1, m0, m1, x);
      result.push({ period: `${year} ${q}`, value: round2(val) });
    }
  }

  return result;
}

function lookupOrClamp(
  map: Map<number, number>,
  years: number[],
  target: number,
  firstYear: number,
  lastYear: number,
): number {
  if (map.has(target)) return map.get(target)!;
  if (target < firstYear) return map.get(firstYear)!;
  if (target > lastYear) return map.get(lastYear)!;

  // Linear interpolate between bracketing years
  const lower = [...years].reverse().find((y) => y < target) ?? firstYear;
  const upper = years.find((y) => y > target) ?? lastYear;
  if (lower === upper) return map.get(lower)!;
  const t = (target - lower) / (upper - lower);
  return map.get(lower)! + t * (map.get(upper)! - map.get(lower)!);
}

/** Hermite cubic interpolation on [x0, x1] with endpoint values y0, y1 and slopes m0, m1. */
function hermite(
  x0: number, y0: number,
  x1: number, y1: number,
  m0: number, m1: number,
  x: number,
): number {
  const h = x1 - x0;
  if (h === 0) return y0;
  const t = (x - x0) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return h00 * y0 + h10 * h * m0 + h01 * y1 + h11 * h * m1;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/* ---------- service ---------- */

export class IndicatorService {
  async seedDatabase(countryName?: string): Promise<{ seeded: number }> {
    const countries = countryName
      ? countryMappings.filter((c) => c.name === countryName)
      : countryMappings;

    if (countries.length === 0) throw new Error(`Unknown country: ${countryName}`);

    const sourceId = await getDataSourceId("world_bank", "World Bank API");
    let count = 0;

    for (const country of countries) {
      for (const mapping of indicatorMappings) {
        const annual = await fetchIndicator(country.isoCode, mapping.wbCode, {
          from: 2010,
          to: 2025,
        });
        if (annual.length === 0) continue;

        const filtered = annual.filter((d) => d.value !== null) as { year: number; value: number }[];
        if (filtered.length === 0) continue;

        const quarterly = interpolateAnnualToQuarterly(filtered, 2010, 2025);
        const code = buildIndicatorId(country.slug, mapping.suffix);

        const series = await upsertSeries({
          code,
          name: mapping.name,
          description: mapping.description,
          unit: mapping.unit,
          frequency: "Quarterly",
          dataSourceId: sourceId,
        });

        await upsertPoints(
          series.id,
          quarterly.map((p) => ({ date: p.period, value: p.value })),
        );
        count++;
      }
    }

    return { seeded: count };
  }

  async getIndicator(id: string): Promise<Indicator | null> {
    const cacheKey = generateCacheKey("indicators", "detail", { id });
    const result = await cache.getOrSet<Indicator | null>(
      cacheKey,
      async () => {
        const series = await findSeriesByCode(id);
        if (!series) return null;

        const points = await findPointsBySeriesId(series.id);
        const { country, suffix } = parseIndicatorId(id);
        const mapping = indicatorMappings.find((m) => m.suffix === suffix);

        return {
          id: series.code,
          name: mapping?.name ?? series.name,
          shortName: mapping?.shortName ?? series.name,
          country: country ?? "",
          category: mapping?.category ?? "GDP",
          unit: mapping?.unit ?? series.unit ?? "",
          frequency: series.frequency ?? "Quarterly",
          source: mapping?.source ?? "World Bank",
          description: mapping?.description ?? series.description ?? "",
          coverage: "2010 Q1 – 2025 Q4",
          updated: series.lastUpdated ?? new Date().toISOString(),
          series: points.map((p) => ({ period: p.date, value: p.value })),
        };
      },
      CacheTTL.LONG,
    );
    return result.data;
  }

  async listIndicators(filter?: {
    country?: string;
    category?: string;
    q?: string;
  }): Promise<Indicator[]> {
    const cacheKey = generateCacheKey("indicators", "list", filter ?? {});
    const result = await cache.getOrSet<Indicator[]>(
      cacheKey,
      async () => {
        const allSeries = await listAllSeriesFiltered(filter);
        const indicators: Indicator[] = [];
        for (const series of allSeries) {
          const ind = await this.getIndicator(series.code);
          if (ind) indicators.push(ind);
        }
        return indicators;
      },
      CacheTTL.MEDIUM,
    );
    return result.data ?? [];
  }

  async getSeries(
    id: string,
    from?: number,
    to?: number,
  ): Promise<{ points: Point[]; unit: string; frequency: string } | null> {
    const indicator = await this.getIndicator(id);
    if (!indicator) return null;

    let points = indicator.series;
    if (from !== undefined && to !== undefined) {
      points = points.filter((p) => {
        const y = Number(p.period.slice(0, 4));
        return y >= from && y <= to;
      });
    }

    return { points, unit: indicator.unit, frequency: indicator.frequency };
  }
}

/* ---------- helpers ---------- */

function parseIndicatorId(id: string): { country?: string; suffix?: string } {
  for (const country of countryMappings) {
    if (id.startsWith(country.slug + "-")) {
      return { country: country.name, suffix: id.slice(country.slug.length + 1) };
    }
  }
  return {};
}

async function listAllSeriesFiltered(filter?: {
  country?: string;
  category?: string;
  q?: string;
}) {
  const all = await listAllSeries();

  return all.filter((s) => {
    const { country: c, suffix } = parseIndicatorId(s.code);
    if (filter?.country && c !== filter.country) return false;

    const mapping = indicatorMappings.find((m) => m.suffix === suffix);
    if (filter?.category && mapping?.category !== filter.category) return false;

    const q = filter?.q?.toLowerCase();
    if (q) {
      const text = `${mapping?.name ?? ""} ${mapping?.category ?? ""} ${c ?? ""}`.toLowerCase();
      if (!text.includes(q)) return false;
    }

    return true;
  });
}

export const indicatorService = new IndicatorService();