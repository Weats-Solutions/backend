import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientOptions, Transport, RedisOptions } from '@nestjs/microservices';
import { RedisConfigService } from './redis-config.service';

@Injectable()
export class GatewayConfigService {
  private readonly logger = new Logger(GatewayConfigService.name);
  constructor(
    private configService: ConfigService,
    private redisConfig: RedisConfigService,
  ) { }

  getDashboardClientHost(): string {
    const isProd = this.configService.get('NODE_ENV') === 'production';
    this.logger.log("IS PROD", isProd);
    return isProd ? 'weats-prod-dashboard' : 'localhost';
  }

  getDashboardClientPort(): number {
    return parseInt(
      this.configService.getOrThrow<string>('DASHBOARD_CLIENT_PORT'),
      10,
    );
  }

  get dashboardClientOptions(): ClientOptions {
    this.logger.log("HOST", this.getDashboardClientHost());
    this.logger.log("PORT", this.getDashboardClientPort());
    return {
      transport: Transport.TCP,
      options: {
        host: this.getDashboardClientHost(),
        port: this.getDashboardClientPort(),
      },
    };
  }

  get webhooksClientOptions(): ClientOptions {
    return {
      transport: Transport.REDIS,
      options: {
        ...this.redisConfig.getConnectionOptions('jobs'),
        retryAttempts: 10,
        retryDelay: 5000,
        keepAlive: 1000,
      },
    };
  }
}
