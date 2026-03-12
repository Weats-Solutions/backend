import { Module } from '@nestjs/common';
import { GatewayConfigService } from './gateway-config.service';
import { ClerkConfigService } from './clerk-config.service';
import { AppConfigService } from './app-config.service';
import { StripeConfigService } from './stripe-config.service';
import { RedisConfigService } from './redis-config.service';
import { CloudflareConfigService } from './cloudflare-config.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [
    GatewayConfigService,
    ClerkConfigService,
    AppConfigService,
    StripeConfigService,
    RedisConfigService,
    CloudflareConfigService,
  ],
  exports: [
    GatewayConfigService,
    ClerkConfigService,
    AppConfigService,
    StripeConfigService,
    RedisConfigService,
    CloudflareConfigService,
  ],
})
export class ConfigsModule { }
