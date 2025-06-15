import { Provider } from '@nestjs/common';
import * as Redis from 'ioredis';

import { ConfigService } from '@nestjs/config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
      const password = configService.get<string>('REDIS_PASSWORD');
    return new Redis.default({
      host: configService.get<string>('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'),
      // password: configService.get<string>('REDIS_PASSWORD'),
          ...(password && { password }), 

    });
  },
};
