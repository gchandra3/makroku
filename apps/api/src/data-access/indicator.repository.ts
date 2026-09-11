/**
 * Data access layer for indicators — Drizzle queries on
 * data_series and data_points tables.
 */

import { eq } from "drizzle-orm";
import { db } from "../db";
import { dataSeries, dataPoints, type NewDataSeries, type NewDataPoint } from "../schema";
import { v4 as uuid } from "uuid";

type SeriesRow = typeof dataSeries.$inferSelect;
type PointRow = typeof dataPoints.$inferSelect;

export async function upsertSeries(series: {
  code: string;
  name: string;
  description?: string;
  unit?: string;
  frequency?: string;
  dataSourceId: string;
}): Promise<SeriesRow> {
  const existing = await db
    .select()
    .from(dataSeries)
    .where(eq(dataSeries.code, series.code))
    .then((r) => r[0]);

  if (existing) {
    await db
      .update(dataSeries)
      .set({
        name: series.name,
        description: series.description ?? null,
        unit: series.unit ?? null,
        frequency: series.frequency ?? null,
        lastUpdated: new Date().toISOString(),
      })
      .where(eq(dataSeries.id, existing.id));
    return { ...existing, ...series, lastUpdated: new Date().toISOString() };
  }

  const row: NewDataSeries = {
    id: uuid(),
    dataSourceId: series.dataSourceId,
    code: series.code,
    name: series.name,
    description: series.description ?? null,
    unit: series.unit ?? null,
    frequency: series.frequency ?? null,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  await db.insert(dataSeries).values(row);
  return row as SeriesRow;
}

export async function upsertPoints(seriesId: string, points: { date: string; value: number }[]): Promise<void> {
  for (const pt of points) {
    const row: NewDataPoint = {
      id: uuid(),
      seriesId,
      date: pt.date,
      value: pt.value,
      createdAt: new Date().toISOString(),
    };
    await db
      .insert(dataPoints)
      .values(row)
      .onConflictDoUpdate({
        target: [dataPoints.seriesId, dataPoints.date],
        set: { value: pt.value },
      });
  }
}

export async function findSeriesByCode(code: string): Promise<SeriesRow | undefined> {
  return db.select().from(dataSeries).where(eq(dataSeries.code, code)).then((r) => r[0]);
}

export async function findPointsBySeriesId(seriesId: string): Promise<PointRow[]> {
  return db.select().from(dataPoints).where(eq(dataPoints.seriesId, seriesId));
}

export async function listAllSeries(): Promise<SeriesRow[]> {
  return db.select().from(dataSeries);
}

export async function getDataSourceId(type: string, name: string): Promise<string> {
  const { dataSources } = await import("../schema");
  const existing = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.type, type as "world_bank" | "fred" | "custom" | "uploaded"))
    .then((r) => r.find((ds) => ds.name === name));

  if (existing) return existing.id;

  const id = uuid();
  await db.insert(dataSources).values({
    id,
    name,
    type: type as "world_bank",
    description: null,
    config: {},
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return id;
}