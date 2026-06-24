import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { EstablishmentModule } from './modules/establishment/establishment.module';
import { UserModule } from './modules/user/user.module';
import { PlanModule } from './modules/plan/plan.module';
import { ImageModule } from './modules/image/image.module';

import { ConfigsModule, AppConfigService, getPinoConfig } from '@weats/configs';
import { ConfigModule } from '@nestjs/config';
import { EupagoModule } from './modules/integrations/eupago/eupago.module';
import { XdRestModule as XdRestDashboardModule } from './modules/integrations/xd-rest/xd-rest.module';
import { MenuModule } from './modules/menu/menu.module';
import { ItemModule } from './modules/item/item.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { StatsModule } from './modules/stats/stats.module';
import { ZoneModule } from './modules/zone/zone.module';
import { ThemeModule } from './modules/theme/theme.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { QueuesModule } from '@weats/bull';
import { CacheModule } from '@weats/cache';
import { RateLimitModule } from '@weats/rate-limit';

import { DatabaseModule } from '@weats/database';
import { IntegrationsModule } from '@weats/integrations';
import { EncryptionModule } from '@weats/encryption';
import { FeatureUsageModule } from '@weats/common/feature/feature-usage.module';

import { APP_GUARD } from '@nestjs/core';
import { ClerkGuard, EstablishmentStaffGuard, ActiveSubscriptionGuard, RequestIdMiddleware, RateLimitGuard } from '@weats/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigsModule],
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => getPinoConfig(appConfig),
    }),
    ConfigsModule,
    QueuesModule,
    CacheModule,
    DatabaseModule,
    IntegrationsModule,
    EncryptionModule,
    FeatureUsageModule,
    RateLimitModule,
    EstablishmentModule,
    UserModule,
    PlanModule,
    ImageModule,
    EupagoModule,
    XdRestDashboardModule,
    MenuModule,
    ItemModule,
    ExpenseModule,
    StatsModule,
    ZoneModule,
    ThemeModule,
    MonitoringModule,
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
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
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class DashboardModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
