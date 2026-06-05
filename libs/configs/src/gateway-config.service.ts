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
    const env = this.configService.get<string>('WEATS_ENV');
    this.logger.log("WEATS_ENV", env);
    if (env === 'local') {
      return 'localhost';
    }
    return env === 'dev' ? 'weats-dev-dashboard' : 'weats-prod-dashboard';
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

  getLandingClientHost(): string {
    const env = this.configService.get<string>('WEATS_ENV');
    this.logger.log("WEATS_ENV", env);
    if (env === 'local') {
      return 'localhost';
    }
    return env === 'dev' ? 'weats-dev-landing' : 'weats-prod-landing';
  }

  getLandingClientPort(): number {
    return parseInt(
      this.configService.getOrThrow<string>('LANDING_CLIENT_PORT'),
      10,
    );
  }

  get landingClientOptions(): ClientOptions {
    this.logger.log("HOST", this.getLandingClientHost());
    this.logger.log("PORT", this.getLandingClientPort());
    return {
      transport: Transport.TCP,
      options: {
        host: this.getLandingClientHost(),
        port: this.getLandingClientPort(),
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
