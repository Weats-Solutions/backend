import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { EstablishmentModule } from './modules/establishment/establishment.module';
import { UserModule } from './modules/user/user.module';
import { PlanModule } from './modules/plan/plan.module';

import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    EstablishmentModule,
    UserModule,
    PlanModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule { }
