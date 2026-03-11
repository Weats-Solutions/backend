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
}
