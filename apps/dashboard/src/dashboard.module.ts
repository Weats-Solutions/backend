import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { EstablishmentModule } from './modules/establishment/establishment.module';
import { UserModule } from './modules/user/user.module';
import { PlanModule } from './modules/plan/plan.module';
import { ImageModule } from './modules/image/image.module';
import { LandingpageModule } from './modules/landingpage/landingpage.module';
import { ConfigsModule } from '@weats/configs';
import { ConfigModule } from '@nestjs/config';
import { EupagoModule } from './modules/integrations/eupago/eupago.module';
import { MenuModule } from './modules/menu/menu.module';
import { ItemModule } from './modules/item/item.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { StatsModule } from './modules/stats/stats.module';
import { ZoneModule } from './modules/zone/zone.module';
import { QueuesModule } from '@weats/bull';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    ConfigsModule,
    QueuesModule,
    EstablishmentModule,
    UserModule,
    PlanModule,
    ImageModule,
    LandingpageModule,
    EupagoModule,
    MenuModule,
    ItemModule,
    ExpenseModule,
    StatsModule,
    ZoneModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule { }
