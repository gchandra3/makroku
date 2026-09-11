/**
 * Environment configuration with Zod validation
 */

import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database
  DATABASE_URL: z.string().default('file:./data/makroku.db'),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // Regression Service
  REGRESSION_SERVICE_URL: z.string().url().default('http://localhost:8000'),

  // External APIs
  WORLD_BANK_API_BASE: z.string().url().default('https://api.worldbank.org/v2'),
  FRED_API_KEY: z.string().optional(),
  FRED_API_BASE: z.string().url().default('https://api.stlouisfed.org/fred'),

  // LLM
  LLM_PROVIDER: z.enum(['openai', 'anthropic', 'mock']).default('mock'),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('gpt-4o-mini'),
});

export type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export const env = getEnv();