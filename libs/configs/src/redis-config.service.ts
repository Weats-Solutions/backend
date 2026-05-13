import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RedisServiceType } from '@weats/common';

@Injectable()
export class RedisConfigService {
  constructor(private configService: ConfigService) { }

  getRedisHost(): string {
    return this.configService.getOrThrow<string>('REDIS_HOST');
  }

  getRedisPort(): string {
    return this.configService.getOrThrow<string>('REDIS_PORT');
  }

  getRedisUsername(): string {
    return this.configService.getOrThrow<string>('REDIS_USERNAME');
  }

  getRedisPassword(): string {
    return this.configService.getOrThrow<string>('REDIS_PASSWORD');
  }

  getConnectionOptions(serviceType: RedisServiceType) {
    const db = this.getDatabaseForService(serviceType);

    return {
      host: this.getRedisHost(),
      port: Number(this.getRedisPort()),
      username: this.getRedisUsername(),
      password: this.getRedisPassword(),
      db,
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        // Tenta reconectar a cada (tentativas * 2s), até um máximo de 30s
        const delay = Math.min(times * 2000, 30000);
        return delay;
      },
    };
  }

  /**
   * Get the appropriate database number for each service type
   */
  private getDatabaseForService(serviceType: RedisServiceType): number {
    const dbMap: Record<RedisServiceType, number> = {
      jobs: Number(this.configService.getOrThrow<string>('REDIS_JOB_DB')),
      cache: Number(this.configService.getOrThrow<string>('REDIS_CACHE_DB')),
      realtime: Number(this.configService.get<string>('REDIS_REALTIME_DB')),
      rateLimit: Number(this.configService.get<string>('REDIS_RATE_LIMIT_DB')),
    };

    return dbMap[serviceType];
  }
}
