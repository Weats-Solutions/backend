import { Module } from '@nestjs/common';
import { ClerkModule } from './clerk/clerk.module';
import { StripeModule } from './stripe/stripe.module';
import { CloudflareModule } from './cloudflare/cloudflare.module';
import { EupagoModule } from './eupago/eupago.module';
import { FaviconModule } from './favicon/favicon.module';

@Module({
  imports: [ClerkModule, StripeModule, CloudflareModule, EupagoModule, FaviconModule],
  exports: [ClerkModule, StripeModule, CloudflareModule, EupagoModule, FaviconModule],
})
export class IntegrationsModule { }
