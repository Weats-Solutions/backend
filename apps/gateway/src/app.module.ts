import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@weats/database';
import { validate } from './validators/env.validation';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ConfigsModule } from '@weats/configs';
import { IntegrationsModule } from '@weats/integrations';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
