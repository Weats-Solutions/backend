import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './user/users.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@weats/database';
import { validate } from './validators/env.validation';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ConfigsModule } from '@weats/configs';
import { IntegrationsModule } from '@weats/integrations';
import { TranslateModule } from './modules/translate/translate.module';
import { QueuesModule } from '@weats/bull';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    /*
    ThrottlerModule.forRootAsync({
      useFactory: () => throttlerConfig,
    }),
    */
    ConfigsModule,
    IntegrationsModule,
    UsersModule,
    DatabaseModule,
    DashboardModule,
    TranslateModule,
    QueuesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    /*{
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },*/
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
