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
        const options = redisConfig.getConnectionOptions('cache');
        console.log(`[CacheModule] Inicializando Redis com: host=${options.host}, port=${options.port}, db=${options.db}`);
        const client = new Redis(options);
        return client;
      },
      inject: [RedisConfigService],
    },
  ],
  exports: [CacheService],
})
export class CacheModule { }
