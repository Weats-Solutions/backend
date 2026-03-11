import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class GatewayConfigService {
  constructor(private configService: ConfigService) {}

  getDashboardClientPort(): number {
    return this.configService.getOrThrow<number>('DASHBOARD_CLIENT_PORT');
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
