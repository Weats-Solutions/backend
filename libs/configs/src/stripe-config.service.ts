import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeConfigService {
  constructor(private configService: ConfigService) {}

  getStripeApiKey(): string {
    return this.configService.getOrThrow<string>('STRIPE_API_KEY');
  }

  getStripeApiVersion(): string {
    return this.configService.getOrThrow<string>('STRIPE_API_VERSION');
  }

  getStripeWebhookSecret(): string {
    return this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
  }
}
