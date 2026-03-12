import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) { }

  getAppUrl(): string {
    return this.configService.getOrThrow<string>('APP_URL');
  }

  getApiPort(): string {
    return this.configService.getOrThrow<string>('API_PORT');
  }

  getNodeEnv(): string {
    return this.configService.getOrThrow<string>('NODE_ENV');
  }
}
