import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) { }

  getAppUrl(): string {
    return this.configService.getOrThrow<string>('APP_URL');
  }

  getMenuUrl(): string {
    return this.configService.getOrThrow<string>('MENU_URL')
  }

  getMenuCacheToken(): string {
    return this.configService.getOrThrow<string>('MENU_CACHE_TOKEN')
  }

  getApiPort(): string {
    return this.configService.getOrThrow<string>('API_PORT');
  }

  getNodeEnv(): string {
    return this.configService.getOrThrow<string>('NODE_ENV');
  }
}
