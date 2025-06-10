import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitOptions } from '@common/decorators/rate-limit.decorator';
import { Request } from 'express';
import * as crypto from 'crypto';
import { REDIS_CLIENT } from '@common/providers/redis.provider';
import Redis from 'ioredis';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();

    const rateLimitOptions = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, handler);

    // No rate limit set, allow the request
    if (!rateLimitOptions) return true;

   const clientIp = request.ip || 'unknown';
    const hashedIp = this.hashIp(clientIp);
    const redisKey = `rate-limit:${hashedIp}`;

    const currentCount = await this.redisClient.incr(redisKey);

    if (currentCount === 1) {
      // Set expiry only the first time
      await this.redisClient.expire(redisKey, Math.floor(rateLimitOptions.windowMs / 1000));
    }

    if (currentCount > rateLimitOptions.limit) {
      const ttl = await this.redisClient.ttl(redisKey);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter: `${ttl}s`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private hashIp(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex');
  }
}
