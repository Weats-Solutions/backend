import { Module } from '@nestjs/common';
import { ClerkModule } from './clerk/clerk.module';
import { StripeModule } from './stripe/stripe.module';

@Module({
  imports: [ClerkModule, StripeModule],
  exports: [ClerkModule, StripeModule],
})
export class IntegrationsModule {}
