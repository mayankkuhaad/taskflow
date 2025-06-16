// src/common/shared.module.ts

import { Module } from '@nestjs/common';
import { RedisProvider } from './providers/redis.provider';

@Module({
  providers: [RedisProvider],
  exports: [RedisProvider],
})
export class SharedModule {}
