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
    };
  }

  /**
   * Get the appropriate database number for each service type
   */
  private getDatabaseForService(serviceType: RedisServiceType): number {
    const dbMap: Record<RedisServiceType, number> = {
      images: Number(this.configService.getOrThrow<string>('REDIS_IMAGE_DB')),
      jobs: Number(this.configService.getOrThrow<string>('REDIS_JOB_DB')),
      webhooks: Number(this.configService.getOrThrow<string>('REDIS_WEBHOOK_DB')),
      emails: Number(this.configService.getOrThrow<string>('REDIS_EMAIL_DB')),
      cache: Number(this.configService.getOrThrow<string>('REDIS_CACHE_DB')),
      realtime: Number(this.configService.get<string>('REDIS_REALTIME_DB') || 9),
      qrcodes: Number(this.configService.getOrThrow<string>('REDIS_QRCODES_DB')),
      nextCache: Number(this.configService.getOrThrow<string>('REDIS_NEXT_CACHE_DB')),
    };

    return dbMap[serviceType];
  }
}
