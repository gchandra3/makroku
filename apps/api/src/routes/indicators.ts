/**
 * Indicator API routes — expose economic indicators from the backend.
 *
 *   GET  /api/v1/indicators            — list (country, category, q filters)
 *   GET  /api/v1/indicators/:id        — single indicator detail
 *   GET  /api/v1/indicators/:id/series  — time series data
 *   POST /api/v1/indicators/seed       — trigger data ingestion
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { indicatorService } from "../services/indicator.service";

const IndicatorQuerySchema = z.object({
  country: z.string().optional(),
  category: z.string().optional(),
  q: z.string().optional(),
});

const SeedBodySchema = z.object({
  country: z.string().optional(),
});

export async function indicatorRoutes(app: FastifyInstance) {
  // List indicators
  app.get<{ Querystring: z.infer<typeof IndicatorQuerySchema> }>(
    "/api/v1/indicators",
    {
      schema: {
        querystring: IndicatorQuerySchema,
      },
    },
    async (request) => {
      const { country, category, q } = request.query;
      const indicators = await indicatorService.listIndicators({ country, category, q });
      return { data: indicators, total: indicators.length };
    },
  );

  // Single indicator
  app.get<{ Params: { id: string } }>(
    "/api/v1/indicators/:id",
    {
      schema: {
        params: z.object({ id: z.string().min(1) }),
      },
    },
    async (request, reply) => {
      const indicator = await indicatorService.getIndicator(request.params.id);
      if (!indicator) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: `Indicator "${request.params.id}" not found`,
          timestamp: new Date().toISOString(),
        });
      }
      return indicator;
    },
  );

  // Series only
  app.get<{
    Params: { id: string };
    Querystring: { from?: number; to?: number };
  }>(
    "/api/v1/indicators/:id/series",
    {
      schema: {
        params: z.object({ id: z.string().min(1) }),
        querystring: z.object({
          from: z.coerce.number().int().optional(),
          to: z.coerce.number().int().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { from, to } = request.query;
      const result = await indicatorService.getSeries(id, from, to);
      if (!result) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: `Indicator "${id}" not found`,
          timestamp: new Date().toISOString(),
        });
      }
      return result;
    },
  );

  // Seed database from World Bank
  app.post<{ Body: z.infer<typeof SeedBodySchema> }>(
    "/api/v1/indicators/seed",
    {
      schema: {
        body: SeedBodySchema,
      },
    },
    async (request, reply) => {
      try {
        const result = await indicatorService.seedDatabase(request.body.country);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Seed failed";
        return reply.status(400).send({
          code: "SEED_FAILED",
          message,
          timestamp: new Date().toISOString(),
        });
      }
    },
  );
}