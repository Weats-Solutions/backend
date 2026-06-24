import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService, HealthIndicatorResult } from '@nestjs/terminus';
import { RATE_LIMIT_REDIS_TOKEN } from '@weats/rate-limit';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(RATE_LIMIT_REDIS_TOKEN)
    private readonly redis: Redis,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    try {
      const pong = await this.redis.ping();
      if (pong === 'PONG') {
        return indicator.up();
      }
      return indicator.down({ message: `Unexpected ping response: ${pong}` });
    } catch (error) {
      return indicator.down({ message: error.message });
    }
  }
}
