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

  getCatalogApiUrl(): string {
    return this.configService.getOrThrow<string>('CATALOG_API_URL');
  }

  getCatalogMenuUrl(): string {
    return this.configService.getOrThrow<string>('CATALOG_MENU_URL');
  }

  getMenuCacheToken(): string {
    return this.configService.getOrThrow<string>('MENU_CACHE_TOKEN');
  }

  getDashboardPort(): string {
    return this.configService.getOrThrow<string>('DASHBOARD_PORT');
  }

  getWebhooksPort(): string {
    return this.configService.getOrThrow<string>('WEBHOOKS_PORT');
  }

  getNodeEnv(): string {
    return this.configService.getOrThrow<string>('NODE_ENV');
  }

  getSendMail(): boolean {
    const value = this.configService.getOrThrow<any>('SEND_MAIL');
    return value === true || value === 'true';
  }

  getRealtimePort(): string {
    return this.configService.getOrThrow<string>('REALTIME_PORT');
  }

  getQrSessionSecret(): string {
    return this.configService.getOrThrow<string>('QR_SESSION_SECRET');
  }

  getWeatsEnv(): string {
    return this.configService.getOrThrow<string>('WEATS_ENV');
  }

  getTranslateApiUrl(): string {
    return this.configService.getOrThrow<string>('TRANSLATE_API_URL');
  }

  getMailProvider(): 'zepto' | 'resend' {
    const provider = this.configService.get<string>('MAIL_PROVIDER');
    if (provider === 'resend') {
      return 'resend';
    }
    return 'zepto';
  }
}
