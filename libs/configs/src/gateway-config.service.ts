import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientOptions, Transport, RedisOptions } from '@nestjs/microservices';
import { RedisConfigService } from './redis-config.service';

@Injectable()
export class GatewayConfigService {
  constructor(
    private configService: ConfigService,
    private redisConfig: RedisConfigService,
  ) { }

  getDashboardClientPort(): number {
    return parseInt(this.configService.getOrThrow<string>('DASHBOARD_CLIENT_PORT'), 10);
  }

  get dashboardClientOptions(): ClientOptions {
    return {
      transport: Transport.TCP,
      options: {
        port: this.getDashboardClientPort(),
      },
    };
  }

  get webhooksClientOptions(): ClientOptions {
    return {
      transport: Transport.REDIS,
      options: {
        ...this.redisConfig.getConnectionOptions('webhooks'),
        retryAttempts: 10,
        retryDelay: 5000,
        keepAlive: 1000,
      },
    };
  }
}
