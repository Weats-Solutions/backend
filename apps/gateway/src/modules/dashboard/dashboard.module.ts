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
import { EupagoIntegrationController } from './controllers/integrations/eupago.controller';
import { EncryptionModule } from '@weats/encryption';
import { FeatureUsageModule } from '@weats/common/feature/feature-usage.module';
import { MenuController } from './controllers/menu.controller';
import { ItemController } from './controllers/item.controller';
import { AddonController } from './controllers/addon.controller';
import { VariantOptionsController } from './controllers/variant-options.controller';
import { MenuCategoryController } from './controllers/menu/category.controller';
import { MenuSubcategoryController } from './controllers/menu/subcategory.controller';
import { ExpenseController } from './controllers/expense.controller';
import { StatsController } from './controllers/stats.controller';
import { ZonePointController } from './controllers/zone/point.controller';
import { ZonesController } from './controllers/zone/zone.controller';
import { QrCodesController } from './controllers/zone/qr-codes.controller';
import { InvoiceController } from './controllers/invoice.controller';
import { EmailProducer } from '@weats/bull/producers/email.producer';
import { QueuesModule } from '@weats/bull';
import { ThemeController } from './controllers/theme.controller';

import { APP_GUARD } from '@nestjs/core';
import { ClerkGuard, EstablishmentStaffGuard, ActiveSubscriptionGuard } from '@weats/common';

@Module({
  imports: [ConfigsModule, IntegrationsModule, DatabaseModule, EncryptionModule, FeatureUsageModule, QueuesModule],
  providers: [
    EmailProducer,
    {
      provide: DASHBOARD_SERVICE,
      useFactory: (configService: GatewayConfigService) => {
        const clientOptions = configService.dashboardClientOptions;
        return ClientProxyFactory.create(clientOptions);
      },
      inject: [GatewayConfigService],
    },
    {
      provide: APP_GUARD,
      useClass: ClerkGuard,
    },
    {
      provide: APP_GUARD,
      useClass: EstablishmentStaffGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ActiveSubscriptionGuard,
    },
  ],
  controllers: [
    //Core
    EstablishmentController,
    UserController,
    PlanController,
    ImageController,

    //Menu
    MenuSubcategoryController,
    MenuCategoryController,
    MenuController,

    //Zones
    QrCodesController,
    ZonesController,
    ZonePointController,

    //Items
    AddonController,
    VariantOptionsController,
    ItemController,

    //Integrations
    EupagoIntegrationController,

    //Expenses
    ExpenseController,

    //Invoices
    InvoiceController,

    //Theme
    ThemeController,

    //Stats
    StatsController,

    
  ],
})
export class DashboardModule { }
