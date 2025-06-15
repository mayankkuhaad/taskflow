import { Injectable, Logger } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly redis: Redis.Redis;
  private readonly logger = new Logger(CacheService.name);
  private readonly namespace = 'app_cache'; // Avoid collisions

  constructor() {
    this.redis = new Redis.default({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    });
  }

  private buildKey(key: string): string {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid cache key');
    }
    return `${this.namespace}:${key}`;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    const namespacedKey = this.buildKey(key);
    try {
      const serialized = JSON.stringify(value);
      await this.redis.set(namespacedKey, serialized, 'EX', ttlSeconds);
      this.logger.debug(`Cache set: ${namespacedKey} (TTL: ${ttlSeconds}s)`);
    } catch (err) {
  const error = err instanceof Error ? err : new Error(String(err));
  this.logger.error(`Failed to set cache key ${namespacedKey}`, error.stack);
}
  }

  async get<T>(key: string): Promise<T | null> {
    const namespacedKey = this.buildKey(key);
    try {
      const data = await this.redis.get(namespacedKey);
      if (!data) {
        this.logger.debug(`Cache miss: ${namespacedKey}`);
        return null;
      }
      this.logger.debug(`Cache hit: ${namespacedKey}`);
      return JSON.parse(data) as T;
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

      this.logger.error(`Failed to get cache key ${namespacedKey}`, error.stack);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    const namespacedKey = this.buildKey(key);
    try {
      const result = await this.redis.del(namespacedKey);
      this.logger.debug(`Cache delete: ${namespacedKey}`);
      return result > 0;
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

      this.logger.error(`Failed to delete cache key ${namespacedKey}`, error.stack);
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    const namespacedKey = this.buildKey(key);
    try {
      const exists = await this.redis.exists(namespacedKey);
      return exists === 1;
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

      this.logger.error(`Failed to check existence for key ${namespacedKey}`, error.stack);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.namespace}:*`);
      if (keys.length) {
        await this.redis.del(...keys);
      }
      this.logger.warn(`Cache cleared: ${keys.length} keys removed.`);
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

      this.logger.error('Failed to clear cache', error.stack);
    }
  }

  async keys(pattern = '*'): Promise<string[]> {
    try {
      const keys = await this.redis.keys(`${this.namespace}:${pattern}`);
      return keys.map(k => k.replace(`${this.namespace}:`, ''));
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

      this.logger.error('Failed to list cache keys', error.stack);
      return [];
    }
  }

  async getStats(): Promise<{ keyCount: number }> {
    try {
      const keys = await this.redis.keys(`${this.namespace}:*`);
      return { keyCount: keys.length };
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

      this.logger.error('Failed to fetch cache stats', error.stack);
      return { keyCount: 0 };
    }
  }
}
