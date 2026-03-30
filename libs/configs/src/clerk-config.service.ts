import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClerkConfigService {
  constructor(private configService: ConfigService) {}

  getClerkSecretKey(): string {
    return this.configService.getOrThrow<string>('CLERK_SECRET_KEY');
  }

  getClerkWebhookSecret(): string {
    return this.configService.getOrThrow<string>('CLERK_WEBHOOK_SECRET');
  }

  getClerkJwtKey(): string | undefined {
    let key = this.configService.get<string>('CLERK_JWT_KEY');
    if (key) {
      key = key.replace(/\\n/g, '\n');
    }
    return key;
  }
}
