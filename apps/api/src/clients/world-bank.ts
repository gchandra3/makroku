/**
 * World Bank API client.
 * Fetches annual economic indicators, parses the WB JSON format,
 * handles rate limiting with retry logic.
 */

import { env } from "../config";

type WbDataPoint = { year: number; value: number | null };

type WbResponseEntry = {
  country: { id: string; value: string };
  countryiso3code: string;
  indicator: { id: string; value: string };
  date: string;
  value: number | null;
};

type WbPageInfo = {
  page: number;
  pages: number;
  per_page: number;
  total: number;
};

/**
 * Fetch annual indicator data for a country from the World Bank API.
 * Returns parsed data points sorted by year ascending.
 */
export async function fetchIndicator(
  countryCode: string,
  indicatorCode: string,
  years?: { from: number; to: number },
  retries = 3,
): Promise<WbDataPoint[]> {
  const base = env.WORLD_BANK_API_BASE;
  const dateRange = years ? `&date=${years.from}:${years.to}` : "&date=2010:2025";
  const url = `${base}/country/${countryCode}/indicator/${indicatorCode}?format=json&per_page=100${dateRange}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);

      if (res.status === 429) {
        const delay = attempt * 2000;
        console.warn(`World Bank rate limited, retrying in ${delay}ms (attempt ${attempt}/${retries})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (!res.ok) {
        console.error(`World Bank API error: ${res.status} ${res.statusText} for ${indicatorCode}`);
        return [];
      }

      const json = (await res.json()) as [WbPageInfo, WbResponseEntry[] | null];
      const entries = json[1];
      if (!entries) return [];

      return entries
        .filter((e) => e.value !== null)
        .map((e) => ({ year: Number(e.date), value: e.value }))
        .sort((a, b) => a.year - b.year);
    } catch (err) {
      if (attempt === retries) {
        console.error(`World Bank fetch failed for ${indicatorCode}:`, err);
        return [];
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  return [];
}