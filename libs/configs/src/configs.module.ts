import { Module } from '@nestjs/common';
import { GatewayConfigService } from './gateway-config.service';
import { ClerkConfigService } from './clerk-config.service';
import { AppConfigService } from './app-config.service';
import { StripeConfigService } from './stripe-config.service';
import { RedisConfigService } from './redis-config.service';
import { CloudflareConfigService } from './cloudflare-config.service';
import { ConfigModule } from '@nestjs/config';
import { CryptoConfigService } from './crypto-config.service';
import { EupagoConfigService } from './eupago-config.service';
import { DiscordConfigService } from './discord-config.service';
import { ZeptoConfigService } from './zepto-config.service';
import { ResendConfigService } from './resend-config.service';

@Module({
  imports: [ConfigModule],
  providers: [
    GatewayConfigService,
    ClerkConfigService,
    AppConfigService,
    StripeConfigService,
    RedisConfigService,
    CloudflareConfigService,
    CryptoConfigService,
    EupagoConfigService,
    DiscordConfigService,
    ZeptoConfigService,
    ResendConfigService
  ],
  exports: [
    GatewayConfigService,
    ClerkConfigService,
    AppConfigService,
    StripeConfigService,
    RedisConfigService,
    CloudflareConfigService,
    CryptoConfigService,
    EupagoConfigService,
    DiscordConfigService,
    ZeptoConfigService,
    ResendConfigService
  ],
})
export class ConfigsModule { }
