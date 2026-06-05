import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@weats/database';
import { validate } from './validators/env.validation';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ConfigsModule } from '@weats/configs';
import { IntegrationsModule } from '@weats/integrations';
import { TranslateModule } from './modules/translate/translate.module';
import { QueuesModule } from '@weats/bull';
import { RateLimitModule } from '@weats/rate-limit';
import { RateLimitGuard } from '@weats/common';
import { CacheModule } from '@weats/cache';
import { LandingModule } from './modules/landing/landing.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    ConfigsModule,
    IntegrationsModule,
    DatabaseModule,
    DashboardModule,
    LandingModule,
    TranslateModule,
    QueuesModule,
    RateLimitModule,
    CacheModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Rate Limiting global — 200 req/min por utilizador por defeito
    // Rotas sensíveis têm políticas específicas via @RateLimit('POLICY')
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
}) export class AppModule { }
/*
export class AppModule implements NestModule {
 configure(consumer: MiddlewareConsumer) {
   consumer
     .apply(SecurityMiddleware)
     .forRoutes('*'); // Aplica a TODAS as rotas, incluindo 404s
 }
}
*/
