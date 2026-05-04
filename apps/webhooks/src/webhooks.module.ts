import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { AppConfigService, ConfigsModule, RedisConfigService } from '@weats/configs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandleCustomerService } from './stripe/handle-customer.service';
import { HandlePaymentsService } from './stripe/handle-payments.service';
import { HandleSubscriptionsService } from './stripe/handle-subscriptions.service';
import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { ClerkWebhookService } from './clerk/clerk-webhook.service';
import { ClerkModule, DiscordModule, StripeModule } from '@weats/integrations';
import Stripe from 'stripe';
import { WebhooksProcessor } from './webhooks.processor';
import { DatabaseModule } from '@weats/database';
import { QueuesModule } from '@weats/bull';
import { RateLimitModule } from '@weats/rate-limit';
import { RateLimitGuard } from '@weats/common';
import { APP_GUARD } from '@nestjs/core';

import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [
    DatabaseModule,
    ConfigsModule,
    ClerkModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    QueuesModule,
    StripeModule,
    DiscordModule,
    RateLimitModule,
  ],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    WebhooksProcessor,
    ClerkWebhookService,
    HandleCustomerService,
    HandlePaymentsService,
    HandleSubscriptionsService,
    {
      provide: 'APP_URL',
      useFactory: (appConfig: AppConfigService) => appConfig.getAppUrl(),
      inject: [AppConfigService]
    },
    {
      provide: Stripe,
      useFactory: (configService: ConfigService) => {
        return new Stripe(configService.getOrThrow<string>('STRIPE_API_KEY'), {
          apiVersion: configService.getOrThrow<string>('STRIPE_API_VERSION') as Stripe.LatestApiVersion,
        });
      },
      inject: [ConfigService],
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
  exports: [WebhooksService]
})
export class WebhooksModule { }
