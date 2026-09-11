/**
 * Database schema using Drizzle ORM
 */

import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// Regression tables
// ============================================================================

export const regressions = sqliteTable('regressions', {
  id: text('id').primaryKey(),
  target: text('target').notNull(),
  features: text('features', { mode: 'json' }).notNull().$type<string[]>(),
  config: text('config', { mode: 'json' }).notNull(),
  coefficients: text('coefficients', { mode: 'json' }),
  modelFit: text('model_fit', { mode: 'json' }),
  residuals: text('residuals', { mode: 'json' }),
  diagnostics: text('diagnostics', { mode: 'json' }),
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed'] })
    .notNull()
    .default('pending'),
  error: text('error'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text('completed_at'),
}, (table) => ({
  createdAtIdx: index('regressions_created_at_idx').on(table.createdAt),
  statusIdx: index('regressions_status_idx').on(table.status),
}));

// ============================================================================
// Data Source tables
// ============================================================================

export const dataSources = sqliteTable('data_sources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['world_bank', 'fred', 'custom', 'uploaded'] })
    .notNull(),
  description: text('description'),
  config: text('config', { mode: 'json' }).notNull().$type<Record<string, unknown>>(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastFetchedAt: text('last_fetched_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  typeIdx: index('data_sources_type_idx').on(table.type),
  activeIdx: index('data_sources_active_idx').on(table.isActive),
}));

export const dataSeries = sqliteTable('data_series', {
  id: text('id').primaryKey(),
  dataSourceId: text('data_source_id')
    .notNull()
    .references(() => dataSources.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  unit: text('unit'),
  frequency: text('frequency'),
  lastUpdated: text('last_updated'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  sourceIdx: index('data_series_source_idx').on(table.dataSourceId),
  codeIdx: uniqueIndex('data_series_code_idx').on(table.code),
}));

export const dataPoints = sqliteTable('data_points', {
  id: text('id').primaryKey(),
  seriesId: text('series_id')
    .notNull()
    .references(() => dataSeries.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  value: real('value').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  seriesDateIdx: uniqueIndex('data_points_series_date_idx').on(table.seriesId, table.date),
  seriesIdx: index('data_points_series_idx').on(table.seriesId),
}));

// ============================================================================
// Interpretation tables
// ============================================================================

export const interpretations = sqliteTable('interpretations', {
  id: text('id').primaryKey(),
  regressionId: text('regression_id')
    .notNull()
    .references(() => regressions.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  style: text('style', { enum: ['technical', 'executive', 'educational'] })
    .notNull(),
  model: text('model').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  regressionIdx: index('interpretations_regression_idx').on(table.regressionId),
}));

// ============================================================================
// Type exports
// ============================================================================

export type Regression = typeof regressions.$inferSelect;
export type NewRegression = typeof regressions.$inferInsert;

export type DataSource = typeof dataSources.$inferSelect;
export type NewDataSource = typeof dataSources.$inferInsert;

export type DataSeries = typeof dataSeries.$inferSelect;
export type NewDataSeries = typeof dataSeries.$inferInsert;

export type DataPoint = typeof dataPoints.$inferSelect;
export type NewDataPoint = typeof dataPoints.$inferInsert;

export type Interpretation = typeof interpretations.$inferSelect;
export type NewInterpretation = typeof interpretations.$inferInsert;