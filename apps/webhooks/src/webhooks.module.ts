import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
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

@Module({
  imports: [
    DatabaseModule,
    ConfigsModule,
    ClerkModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    BullModule.registerQueueAsync(
      {
        name: 'emails',
        imports: [ConfigsModule],
        inject: [RedisConfigService],
        useFactory: async (
          redisConfig: RedisConfigService,
        ): Promise<BullModuleOptions> => ({
          redis: redisConfig.getConnectionOptions('emails'),
        }),
      },
      {
        name: 'webhooks-queue',
        imports: [ConfigsModule],
        inject: [RedisConfigService],
        useFactory: async (
          redisConfig: RedisConfigService,
        ): Promise<BullModuleOptions> => ({
          redis: redisConfig.getConnectionOptions('webhooks'),
        }),
      },
      
    ),
    StripeModule,
    DiscordModule,
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
  ],
  exports: [WebhooksService]
})
export class WebhooksModule { }
