import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CryptoConfigService {
  constructor(private configService: ConfigService) {}

  getAlgorithm(): string {
    return this.configService.getOrThrow<string>('ENCRYPTION_ALGORITHM');
  }

  getCryptoKey(): string {
    return this.configService.getOrThrow<string>('ENCRYPTION_KEY');
  }

  getSalt(): string {
    return this.configService.getOrThrow<string>('ENCRYPTION_SALT');
  }

  getIv(): string {
    return this.configService.getOrThrow<string>('ENCRYPTION_IV');
  }
}
