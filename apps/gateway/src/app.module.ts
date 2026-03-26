import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './user/users.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@weats/database';
import { validate } from './validators/env.validation';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ConfigsModule } from '@weats/configs';
import { IntegrationsModule } from '@weats/integrations';
import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { RedisConfigService } from '@weats/configs';
import { WebhooksModule } from './modules/webhook/webhook.module';
import { TranslateModule } from './modules/translate/translate.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    ConfigsModule,
    IntegrationsModule,
    UsersModule,
    DatabaseModule,
    DashboardModule,
    TranslateModule,

    WebhooksModule,  // ✅ Registra webhooks-queue aqui
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
    ),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
