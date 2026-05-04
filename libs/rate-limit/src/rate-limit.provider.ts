import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { RedisConfigService } from '@weats/configs';

// Constantes globais do rate limiter — usadas pelo provider e pela guard
export const GLOBAL_RATE_LIMIT_POINTS = 200;  // 200 req/min por utilizador
export const GLOBAL_RATE_LIMIT_DURATION = 60; // segundos

// Token para injetar a instância Redis partilhada pelo rate limiter
export const RATE_LIMIT_REDIS_TOKEN = 'RATE_LIMIT_REDIS';

export const rateLimitRedisProvider = {
    provide: RATE_LIMIT_REDIS_TOKEN,
    useFactory: (redisConfigService: RedisConfigService) => {
        return new Redis(redisConfigService.getConnectionOptions('rateLimit'));
    },
    inject: [RedisConfigService],
};

export const rateLimiterProvider = {
    provide: 'RATE_LIMITER',
    useFactory: (redis: Redis) => {
        return new RateLimiterRedis({
            storeClient: redis,
            keyPrefix: 'rl',
            points: GLOBAL_RATE_LIMIT_POINTS,
            duration: GLOBAL_RATE_LIMIT_DURATION,
        });
    },
    inject: [RATE_LIMIT_REDIS_TOKEN],
};
