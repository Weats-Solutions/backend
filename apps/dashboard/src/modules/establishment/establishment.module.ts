import { EstablishmentService } from './establishment.service';
import { EstablishmentController } from './establishment.controller';
import { Module } from '@nestjs/common';
import { AppConfigService } from '@weats/configs/app-config.service';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsModule } from '@weats/integrations';
import { DatabaseModule } from '@weats/database';

import { ConfigsModule } from '@weats/configs';
import { FeatureUsageModule } from '@weats/common/feature/feature-usage.module';
import { EstablishmentLanguageSyncService } from './establishment-language-sync.service';
import { EstablishmentLanguageSyncProcessor } from './establishment-language-sync.processor';
import { QueuesModule } from '@weats/bull';
import { EstablishmentSubscriptionService } from './services/establishment-subscription.service';
import { EstablishmentBillingSettingsService } from './services/establishment-billing-settings.service';
import { EstablishmentDigitalSettingsService } from './services/establishment-digital-settings.service';
import { EstablishmentGeneralSettingsService } from './services/establishment-general-settings.service';
import { EstablishmentSystemSettingsService } from './services/establishment-system-settings.service';
import { EstablishmentBrandingSettingsService } from './services/establishment-branding-settings.service';
import { EstablishmentLifeCycleService } from './services/establishment-lifecycle.service';
import { EstablishmentQueryService } from './services/establishment-query.service';
import { EstablishmentModuleSettingsService } from './services/establishment-module-settings.service';

@Module({
  imports: [
    ConfigModule,
    ConfigsModule,
    QueuesModule,
    DatabaseModule,
    IntegrationsModule,
    FeatureUsageModule,
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

    // Services
    EstablishmentModuleSettingsService,
    EstablishmentSubscriptionService,
    EstablishmentBillingSettingsService,
    EstablishmentDigitalSettingsService,
    EstablishmentGeneralSettingsService,
    EstablishmentSystemSettingsService,
    EstablishmentBrandingSettingsService,
    EstablishmentLifeCycleService,
    EstablishmentQueryService,
  ],
  exports: [EstablishmentService],
})
export class EstablishmentModule { }
