import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { QrCodeModule } from './qr-code/qr-code.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@weats/cache';
import { RateLimitModule } from '@weats/rate-limit';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from '@weats/common';
import { DatabaseModule } from '@weats/database';
import { DiscordModule } from '@weats/integrations';

@Module({
  imports: [
    CacheModule,
    QrCodeModule,
    DatabaseModule,
    DiscordModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    RateLimitModule
  ],
  controllers: [CatalogController],
  providers: [CatalogService,
    // Rate Limiting global — 200 req/min por utilizador por defeito
    // Rotas sensíveis têm políticas específicas via @RateLimit('POLICY')
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})


export class CatalogModule { }
