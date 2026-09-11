import { FastifyInstance } from 'fastify';
import { cache } from '../cache';

export async function healthRoutes(app: FastifyInstance) {
  // Basic health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Database health check
  app.get('/health/db', async () => {
    // Database health check would go here
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Redis cache health check with stats
  app.get('/health/cache', async () => {
    const health = await cache.healthCheck();
    const stats = cache.getStats();
    return {
      status: health.status,
      latencyMs: health.latencyMs,
      stats,
      timestamp: new Date().toISOString(),
    };
  });
}