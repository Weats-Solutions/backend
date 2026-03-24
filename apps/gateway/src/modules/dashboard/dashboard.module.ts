import { Module } from '@nestjs/common';
import { ClientProxyFactory } from '@nestjs/microservices';
import { GatewayConfigService } from '@weats/configs/gateway-config.service';
import { DASHBOARD_SERVICE } from '@weats/common';
import { ConfigsModule } from '@weats/configs';
import { IntegrationsModule } from '@weats/integrations';
import { DatabaseModule } from '@weats/database';
import { EstablishmentController } from './controllers/establishment.controller';
import { UserController } from './controllers/user.controller';
import { ImageController } from './controllers/image.controller';
import { PlanController } from './controllers/plan.controller';
import { LandingpageController } from './controllers/landingpage.controller';
import { EupagoIntegrationController } from './controllers/integrations/eupago.controller';
import { EncryptionModule } from '@weats/encryption';
import { FeatureUsageModule } from '@weats/common/feature/feature-usage.module';
import { MenuController } from './controllers/menu.controller';

@Module({
  imports: [ConfigsModule, IntegrationsModule, DatabaseModule, EncryptionModule, FeatureUsageModule],
  providers: [
    {
      provide: DASHBOARD_SERVICE,
      useFactory: (configService: GatewayConfigService) => {
        const clientOptions = configService.dashboardClientOptions;
        return ClientProxyFactory.create(clientOptions);
      },
      inject: [GatewayConfigService],
    },
  ],
  controllers: [
    EstablishmentController,
    UserController,
    PlanController,
    ImageController,
    LandingpageController,
    MenuController,
    EupagoIntegrationController,
  ],
})
export class DashboardModule { }
