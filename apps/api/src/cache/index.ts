/**
 * Redis cache service with deterministic cache keys, TTL, and hit/miss handling
 */

import Redis from 'ioredis';
import { env } from '../config';
import { createHash } from 'crypto';

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (redisInstance) return redisInstance;

  redisInstance = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 100, 3000);
    },
    lazyConnect: true,
  });

  redisInstance.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  redisInstance.on('connect', () => {
    console.log('Redis connected');
  });

  return redisInstance;
}

export const redis = getRedis();

/**
 * Generate deterministic cache key from components
 */
export function generateCacheKey(
  namespace: string,
  identifier: string,
  params: Record<string, unknown> = {}
): string {
  // Sort params for deterministic ordering
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, unknown>);

  const paramString = JSON.stringify(sortedParams);
  const hash = createHash('sha256').update(paramString).digest('hex').slice(0, 16);

  return `makroku:${namespace}:${identifier}:${hash}`;
}

/**
 * Default TTLs in seconds
 */
export const CacheTTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 3600,       // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

/**
 * Cache service with hit/miss tracking
 */
export interface CacheGetResult<T> {
  data: T | null;
  hit: boolean;
  key: string;
}

export interface CacheSetOptions {
  ttl?: number;
  nx?: boolean; // Only set if not exists
  xx?: boolean; // Only set if exists
}

export class CacheService {
  private client: Redis;
  private hits = 0;
  private misses = 0;

  constructor(client?: Redis) {
    this.client = client || getRedis();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<CacheGetResult<T>> {
    try {
      const value = await this.client.get(key);
      if (value !== null) {
        this.hits++;
        return { data: JSON.parse(value) as T, hit: true, key };
      }
      this.misses++;
      return { data: null, hit: false, key };
    } catch (error) {
      console.error('Cache get error:', error);
      this.misses++;
      return { data: null, hit: false, key };
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheSetOptions = {}
  ): Promise<boolean> {
    try {
      const { ttl = CacheTTL.MEDIUM, nx, xx } = options;
      const serialized = JSON.stringify(value);

      let result: string | null;
      if (nx) {
        result = await this.client.set(key, serialized, 'EX', ttl, 'NX');
      } else if (xx) {
        result = await this.client.set(key, serialized, 'EX', ttl, 'XX');
      } else {
        result = await this.client.set(key, serialized, 'EX', ttl);
      }

      return result === 'OK';
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<CacheGetResult<T>> {
    const cached = await this.get<T>(key);
    if (cached.hit) return cached;

    try {
      const data = await factory();
      await this.set(key, data, { ttl });
      return { data, hit: false, key };
    } catch (error) {
      console.error('Cache factory error:', error);
      return { data: null, hit: false, key };
    }
  }

  /**
   * Delete key(s)
   */
  async delete(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  /**
   * Delete keys by pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    let cursor = '0';
    let deleted = 0;

    do {
      const [newCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = newCursor;
      if (keys.length > 0) {
        deleted += await this.client.del(...keys);
      }
    } while (cursor !== '0');

    return deleted;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latencyMs?: number }> {
    const start = Date.now();
    try {
      await this.client.ping();
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch {
      return { status: 'unhealthy' };
    }
  }
}

// Singleton instance
let cacheServiceInstance: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService();
  }
  return cacheServiceInstance;
}

export const cache = getCacheService();