import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) { }

  getAppUrl(): string {
    return this.configService.getOrThrow<string>('APP_URL');
  }

  getCatalogPort(): string {
    return this.configService.getOrThrow<string>('CATALOG_PORT');
  }

  getCatalogUrl(): string {
    return this.configService.getOrThrow<string>('CATALOG_URL');
  }

  getMenuCacheToken(): string {
    return this.configService.getOrThrow<string>('MENU_CACHE_TOKEN');
  }

  getGatewayPort(): string {
    return this.configService.getOrThrow<string>('GATEWAY_PORT');
  }

  getWebhooksPort(): string {
    return this.configService.getOrThrow<string>('WEBHOOKS_PORT');
  }

  getNodeEnv(): string {
    return this.configService.getOrThrow<string>('NODE_ENV');
  }

  getSendMail(): boolean {
    return this.configService.getOrThrow<boolean>('SEND_MAIL');
  }

  getRealtimePort(): string {
    return this.configService.getOrThrow<string>('REALTIME_PORT');
  }

  getQrSessionSecret(): string {
    return this.configService.getOrThrow<string>('QR_SESSION_SECRET');
  }
}
