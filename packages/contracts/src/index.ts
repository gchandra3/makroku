/**
 * Shared TypeScript contracts between API, Regression Service, and Frontend
 * Uses Zod for runtime validation and TypeScript type inference
 */

import { z } from 'zod';

// ============================================================================
// Base Types
// ============================================================================

export const UUIDSchema = z.string().uuid();
export type UUID = z.infer<typeof UUIDSchema>;

export const ISODateStringSchema = z.string().datetime({ offset: true });
export type ISODateString = z.infer<typeof ISODateStringSchema>;

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
    }),
  });

// ============================================================================
// Regression Contracts
// ============================================================================

export const RegressionConfigSchema = z.object({
  // Dependent variable (target)
  target: z.string().min(1, 'Target variable is required'),

  // Independent variables (features)
  features: z.array(z.string().min(1)).min(1, 'At least one feature is required'),

  // Optional configuration
  includeIntercept: z.boolean().default(true),
  robustStandardErrors: z.boolean().default(false),
  significanceLevel: z.number().min(0.001).max(0.1).default(0.05),

  // Data configuration
  dataSource: z.string().optional(),
  filters: z.record(z.unknown()).optional(),
  dateRange: z.object({
    start: ISODateStringSchema.optional(),
    end: ISODateStringSchema.optional(),
  }).optional(),
});

export type RegressionConfig = z.infer<typeof RegressionConfigSchema>;

export const RegressionRequestSchema = z.object({
  config: RegressionConfigSchema,
  // Optional: provide data directly instead of fetching from source
  data: z.array(z.record(z.number())).optional(),
});

export type RegressionRequest = z.infer<typeof RegressionRequestSchema>;

// Diagnostics
export const DiagnosticTestSchema = z.object({
  name: z.string(),
  statistic: z.number(),
  pValue: z.number(),
  criticalValue: z.number().optional(),
  interpretation: z.string(),
  passed: z.boolean(),
});

export type DiagnosticTest = z.infer<typeof DiagnosticTestSchema>;

export const CoefficientSchema = z.object({
  name: z.string(),
  estimate: z.number(),
  standardError: z.number(),
  tStatistic: z.number(),
  pValue: z.number(),
  confidenceInterval: z.tuple([z.number(), z.number()]),
  significant: z.boolean(),
});

export type Coefficient = z.infer<typeof CoefficientSchema>;

export const ModelFitSchema = z.object({
  rSquared: z.number(),
  adjustedRSquared: z.number(),
  fStatistic: z.number(),
  fPValue: z.number(),
  logLikelihood: z.number(),
  aic: z.number(),
  bic: z.number(),
  nObservations: z.number().int().positive(),
  degreesOfFreedom: z.number().int().nonnegative(),
});

export type ModelFit = z.infer<typeof ModelFitSchema>;

export const ResidualStatsSchema = z.object({
  mean: z.number(),
  std: z.number(),
  min: z.number(),
  max: z.number(),
  skew: z.number(),
  kurtosis: z.number(),
  jarqueBera: z.number(),
  jarqueBeraPValue: z.number(),
});

export type ResidualStats = z.infer<typeof ResidualStatsSchema>;

export const RegressionResultSchema = z.object({
  id: UUIDSchema,
  config: RegressionConfigSchema,
  coefficients: z.array(CoefficientSchema),
  modelFit: ModelFitSchema,
  residuals: ResidualStatsSchema,
  diagnostics: z.array(DiagnosticTestSchema),
  createdAt: ISODateStringSchema,
  completedAt: ISODateStringSchema.optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  error: z.string().optional(),
});

export type RegressionResult = z.infer<typeof RegressionResultSchema>;

export const RegressionListItemSchema = z.object({
  id: UUIDSchema,
  target: z.string(),
  features: z.array(z.string()),
  rSquared: z.number(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  createdAt: ISODateStringSchema,
});

export type RegressionListItem = z.infer<typeof RegressionListItemSchema>;

// ============================================================================
// Data Source Contracts
// ============================================================================

export const DataSourceTypeSchema = z.enum(['world_bank', 'fred', 'custom', 'uploaded']);
export type DataSourceType = z.infer<typeof DataSourceTypeSchema>;

export const DataSourceSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  type: DataSourceTypeSchema,
  description: z.string().optional(),
  config: z.record(z.unknown()),
  isActive: z.boolean().default(true),
  lastFetchedAt: ISODateStringSchema.optional(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export type DataSource = z.infer<typeof DataSourceSchema>;

export const DataSeriesSchema = z.object({
  id: UUIDSchema,
  dataSourceId: UUIDSchema,
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  unit: z.string().optional(),
  frequency: z.string().optional(),
  lastUpdated: ISODateStringSchema.optional(),
});

export type DataSeries = z.infer<typeof DataSeriesSchema>;

export const DataPointSchema = z.object({
  seriesId: UUIDSchema,
  date: ISODateStringSchema,
  value: z.number(),
});

export type DataPoint = z.infer<typeof DataPointSchema>;

// ============================================================================
// LLM Interpretation Contracts
// ============================================================================

export const InterpretationRequestSchema = z.object({
  regressionId: UUIDSchema,
  prompt: z.string().optional(),
  style: z.enum(['technical', 'executive', 'educational']).default('technical'),
});

export type InterpretationRequest = z.infer<typeof InterpretationRequestSchema>;

export const InterpretationSchema = z.object({
  id: UUIDSchema,
  regressionId: UUIDSchema,
  content: z.string(),
  style: z.enum(['technical', 'executive', 'educational']),
  model: z.string(),
  createdAt: ISODateStringSchema,
});

export type Interpretation = z.infer<typeof InterpretationSchema>;

// ============================================================================
// Health Check Contracts
// ============================================================================

export const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: ISODateStringSchema,
  services: z.record(z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    latencyMs: z.number().optional(),
    error: z.string().optional(),
  })),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;

// ============================================================================
// Error Contracts
// ============================================================================

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  timestamp: ISODateStringSchema,
  requestId: z.string().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// ============================================================================
// Type Guards (for runtime narrowing)
// ============================================================================

export function isRegressionResult(obj: unknown): obj is RegressionResult {
  return RegressionResultSchema.safeParse(obj).success;
}

export function isApiError(obj: unknown): obj is ApiError {
  return ApiErrorSchema.safeParse(obj).success;
}

// ============================================================================
// Indicator Contracts
// ============================================================================

export const IndicatorMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  country: z.string(),
  category: z.string(),
  unit: z.string(),
  frequency: z.string(),
  source: z.string(),
  description: z.string(),
  coverage: z.string(),
  updated: z.string(),
});

export type IndicatorMeta = z.infer<typeof IndicatorMetaSchema>;

export const PointSchema = z.object({
  period: z.string(),
  value: z.number(),
});

export type Point = z.infer<typeof PointSchema>;

export const IndicatorSchema = IndicatorMetaSchema.extend({
  series: z.array(PointSchema),
});

export type Indicator = z.infer<typeof IndicatorSchema>;

export const IndicatorListResponseSchema = z.object({
  data: z.array(IndicatorSchema),
  total: z.number(),
});

export type IndicatorListResponse = z.infer<typeof IndicatorListResponseSchema>;

export const SeriesResponseSchema = z.object({
  points: z.array(PointSchema),
  unit: z.string(),
  frequency: z.string(),
});

export type SeriesResponse = z.infer<typeof SeriesResponseSchema>;