import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { cache, CacheTTL, generateCacheKey } from '../cache';
import { RegressionRequestSchema, RegressionResultSchema } from '@makroku/contracts';
import type { RegressionRequest } from '@makroku/contracts';

export async function regressionRoutes(app: FastifyInstance) {
  // Create regression with caching
  app.post<{ Body: RegressionRequest }>(
    '/api/v1/regression',
    {
      schema: {
        body: RegressionRequestSchema,
        response: {
          200: z.object({
            cached: z.boolean(),
            result: RegressionResultSchema.optional(),
            message: z.string().optional(),
            config: z.unknown().optional(),
          }),
        },
      },
    },
    async (request, reply) => {
      const body = request.body;

      // Generate deterministic cache key based on regression config
      const cacheKey = generateCacheKey('regression', 'run', {
        target: body.config.target,
        features: body.config.features,
        includeIntercept: body.config.includeIntercept,
        robustStandardErrors: body.config.robustStandardErrors,
        significanceLevel: body.config.significanceLevel,
        dataSource: body.config.dataSource,
        filters: body.config.filters,
        dateRange: body.config.dateRange,
        dataProvided: !!body.data,
      });

      // Try to get from cache
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult.hit) {
        return { cached: true, result: cachedResult.data };
      }

      // If not cached, call the regression service
      try {
        const regressionServiceUrl = process.env.REGRESSION_SERVICE_URL || 'http://localhost:8000';

        const response = await fetch(`${regressionServiceUrl}/regress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const error = await response.json();
          return reply.status(response.status).send(error);
        }

        const result = await response.json();

        // Cache the result
        await cache.set(cacheKey, result, { ttl: CacheTTL.MEDIUM });

        return { cached: false, result };
      } catch (error) {
        console.error('Regression service error:', error);
        return reply.status(503).send({
          code: 'SERVICE_UNAVAILABLE',
          message: 'Regression service is unavailable',
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // Get regression by ID (cached)
  app.get<{ Params: { id: string } }>(
    '/api/v1/regression/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: z.object({
            cached: z.boolean(),
            result: RegressionResultSchema.optional(),
          }),
          404: z.object({
            code: z.string(),
            message: z.string(),
            timestamp: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const cacheKey = generateCacheKey('regression', 'result', { id });

      // Try cache first
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult.hit) {
        return { cached: true, result: cachedResult.data };
      }

      // Call regression service
      try {
        const regressionServiceUrl = process.env.REGRESSION_SERVICE_URL || 'http://localhost:8000';

        const response = await fetch(`${regressionServiceUrl}/regress/${id}`);

        if (response.status === 404) {
          return reply.status(404).send({
            code: 'NOT_FOUND',
            message: 'Regression not found',
            timestamp: new Date().toISOString(),
          });
        }

        if (!response.ok) {
          const error = await response.json();
          return reply.status(response.status).send(error);
        }

        const result = await response.json();

        // Cache the result
        await cache.set(cacheKey, result, { ttl: CacheTTL.LONG });

        return { cached: false, result };
      } catch (error) {
        console.error('Regression service error:', error);
        return reply.status(503).send({
          code: 'SERVICE_UNAVAILABLE',
          message: 'Regression service is unavailable',
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // List regressions (cached with short TTL)
  app.get<{ Querystring: { page?: string; limit?: string; status?: string } }>(
    '/api/v1/regression',
    {
      schema: {
        querystring: z.object({
          page: z.coerce.number().int().positive().default(1),
          limit: z.coerce.number().int().positive().max(100).default(20),
          status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
        }),
      },
    },
    async (request, reply) => {
      const query = request.query as unknown as { page: number; limit: number; status?: string };

      const cacheKey = generateCacheKey('regression', 'list', {
        page: query.page,
        limit: query.limit,
        status: query.status,
      });

      const cachedResult = await cache.get(cacheKey);
      if (cachedResult.hit) {
        return { cached: true, result: cachedResult.data };
      }

      try {
        const regressionServiceUrl = process.env.REGRESSION_SERVICE_URL || 'http://localhost:8000';

        const params = new URLSearchParams({
          page: query.page.toString(),
          limit: query.limit.toString(),
        });
        if (query.status) params.append('status', query.status);

        const response = await fetch(`${regressionServiceUrl}/regress?${params}`);

        if (!response.ok) {
          const error = await response.json();
          return reply.status(response.status).send(error);
        }

        const result = await response.json();

        // Cache list with shorter TTL
        await cache.set(cacheKey, result, { ttl: CacheTTL.SHORT });

        return { cached: false, result };
      } catch (error) {
        console.error('Regression service error:', error);
        return reply.status(503).send({
          code: 'SERVICE_UNAVAILABLE',
          message: 'Regression service is unavailable',
          timestamp: new Date().toISOString(),
        });
      }
    }
  );
}