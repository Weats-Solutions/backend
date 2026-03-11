import { Module } from '@nestjs/common';
import { GatewayConfigService } from './gateway-config.service';
import { ClerkConfigService } from './clerk-config.service';
import { AppConfigService } from './app-config.service';
import { StripeConfigService } from './stripe-config.service';
import { RedisConfigService } from './redis-config.service';

@Module({
  providers: [
    GatewayConfigService,
    ClerkConfigService,
    AppConfigService,
    StripeConfigService,
    RedisConfigService,
  ],
  exports: [
    GatewayConfigService,
    ClerkConfigService,
    AppConfigService,
    StripeConfigService,
    RedisConfigService,
  ],
})
export class ConfigsModule {}
