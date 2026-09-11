/**
 * Typed fetch wrapper for the Makroku API.
 * Returns null on any failure so callers can fall back to mock data.
 */
import type { Indicator } from "@/lib/econ-data";

const API_BASE = process.env["VITE_API_URL"] || "http://localhost:3000";

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchIndicators(filter?: {
  country?: string;
  category?: string;
  q?: string;
}): Promise<Indicator[] | null> {
  const params = new URLSearchParams();
  if (filter?.country) params.set("country", filter.country);
  if (filter?.category) params.set("category", filter.category);
  if (filter?.q) params.set("q", filter.q);

  const result = await get<{ data: Indicator[] }>(
    `/api/v1/indicators?${params.toString()}`,
  );
  return result?.data ?? null;
}

export async function fetchIndicator(
  id: string,
): Promise<Indicator | null> {
  return get<Indicator>(`/api/v1/indicators/${encodeURIComponent(id)}`);
}

export async function fetchIndicatorSeries(
  id: string,
  from?: number,
  to?: number,
): Promise<{ points: { period: string; value: number }[]; unit: string; frequency: string } | null> {
  const params = new URLSearchParams();
  if (from !== undefined) params.set("from", String(from));
  if (to !== undefined) params.set("to", String(to));

  return get(`/api/v1/indicators/${encodeURIComponent(id)}/series?${params.toString()}`);
}