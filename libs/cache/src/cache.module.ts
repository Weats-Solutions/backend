import { Global, Module } from '@nestjs/common';
import { ConfigsModule, RedisConfigService } from '@weats/configs';
import Redis from 'ioredis';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [ConfigsModule],
  providers: [
    CacheService,
    {
      provide: 'CACHE_REDIS_CLIENT',
      useFactory: (redisConfig: RedisConfigService) => {
        return new Redis(redisConfig.getConnectionOptions('cache'));
      },
      inject: [RedisConfigService],
    },
  ],
  exports: [CacheService],
})
export class CacheModule {}
