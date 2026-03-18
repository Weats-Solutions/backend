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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    ConfigsModule,
    EstablishmentModule,
    UserModule,
    PlanModule,
    ImageModule,
    LandingpageModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule { }
