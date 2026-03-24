import { EstablishmentService } from './establishment.service';
import { EstablishmentController } from './establishment.controller';
import { Module } from '@nestjs/common';
import { AppConfigService } from '@weats/configs/app-config.service';
import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { RedisConfigService } from '@weats/configs/redis-config.service';
import { IntegrationsModule } from '@weats/integrations';
import { DatabaseModule } from '@weats/database';

import { ConfigsModule } from '@weats/configs';
import { FeatureUsageModule } from '@weats/common/feature/feature-usage.module';

@Module({
  imports: [
    ConfigModule,
    ConfigsModule,
    BullModule.registerQueueAsync({
      name: 'emails',
      imports: [ConfigsModule],
      inject: [RedisConfigService],
      useFactory: async (
        redisConfig: RedisConfigService,
      ): Promise<BullModuleOptions> => ({
        redis: redisConfig.getConnectionOptions('emails'),
      }),
    }),
    DatabaseModule,
    IntegrationsModule,
    FeatureUsageModule
  ],
  controllers: [EstablishmentController],
  providers: [
    {
      provide: 'APP_URL',
      useFactory: async (appConfig: AppConfigService) =>
        appConfig.getAppUrl(),
      inject: [AppConfigService],
    },

    EstablishmentService,
  ],
  exports: [EstablishmentService],
})
export class EstablishmentModule { }
