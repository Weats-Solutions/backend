import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeConfigService } from '@weats/configs/stripe-config.service';
import { DatabaseModule } from '@weats/database';

@Module({
  providers: [
    StripeService,
    StripeConfigService,
    {
      provide: 'STRIPE_API_KEY',
      useFactory: async (stripeConfig: StripeConfigService) =>
        stripeConfig.getStripeApiKey(),
      inject: [StripeConfigService],
    },
    {
      provide: 'STRIPE_API_VERSION',
      useFactory: async (stripeConfig: StripeConfigService) =>
        stripeConfig.getStripeApiVersion(),
      inject: [StripeConfigService],
    },
  ],
  imports: [DatabaseModule],
  exports: [StripeService],
})
export class StripeModule {}
