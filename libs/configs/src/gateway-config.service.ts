import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class GatewayConfigService {
  constructor(private configService: ConfigService) { }

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
}
