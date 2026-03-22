import { Module } from '@nestjs/common';
import { ClerkModule } from './clerk/clerk.module';
import { StripeModule } from './stripe/stripe.module';
import { CloudflareModule } from './cloudflare/cloudflare.module';
import { EupagoModule } from './eupago/eupago.module';

@Module({
  imports: [ClerkModule, StripeModule, CloudflareModule, EupagoModule],
  exports: [ClerkModule, StripeModule, CloudflareModule, EupagoModule],
})
export class IntegrationsModule { }
