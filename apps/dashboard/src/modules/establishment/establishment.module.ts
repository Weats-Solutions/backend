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
import { MenuUtilsModule } from '@weats/common/utils/modules/menu/menu-utils.module';
import { EstablishmentLanguageSyncService } from './establishment-language-sync.service';
import { EstablishmentLanguageSyncProcessor } from './establishment-language-sync.processor';

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
    BullModule.registerQueueAsync({
      name: 'jobs',
      imports: [ConfigsModule],
      inject: [RedisConfigService],
      useFactory: async (
        redisConfig: RedisConfigService,
      ): Promise<BullModuleOptions> => ({
        redis: redisConfig.getConnectionOptions('jobs'),
      }),
    }),
    DatabaseModule,
    IntegrationsModule,
    FeatureUsageModule,
    MenuUtilsModule,
  ],
  controllers: [EstablishmentController],
  providers: [
    {
      provide: 'APP_URL',
      useFactory: (appConfig: AppConfigService) => appConfig.getAppUrl(),
      inject: [AppConfigService],
    },

    EstablishmentService,
    EstablishmentLanguageSyncService,
    EstablishmentLanguageSyncProcessor,
  ],
  exports: [EstablishmentService],
})
export class EstablishmentModule { }
