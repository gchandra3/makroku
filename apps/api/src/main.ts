import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config';
import { redis } from './cache';
import { healthRoutes } from './routes/health';
import { regressionRoutes } from './routes/regression';
import { indicatorRoutes } from './routes/indicators';

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'development' ? 'info' : 'warn',
  },
});

async function start() {
  try {
    // Register plugins
    await app.register(cors);
    await app.register(helmet);
    await app.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });

    // Register routes
    await app.register(healthRoutes, { prefix: '' });
    await app.register(regressionRoutes, { prefix: '' });
    await app.register(indicatorRoutes, { prefix: '' });

    // Connect to Redis
    await redis.connect();

    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${env.PORT}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await app.close();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await app.close();
  await redis.quit();
  process.exit(0);
});

start();