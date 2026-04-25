import { Module } from '@nestjs/common';
import { ClerkModule } from './clerk/clerk.module';
import { StripeModule } from './stripe/stripe.module';
import { CloudflareModule } from './cloudflare/cloudflare.module';
import { EupagoModule } from './eupago/eupago.module';
import { FaviconModule } from './favicon/favicon.module';
import { DiscordModule } from './discord/discord.module';

@Module({
  imports: [ClerkModule, StripeModule, CloudflareModule, EupagoModule, FaviconModule, DiscordModule],
  exports: [ClerkModule, StripeModule, CloudflareModule, EupagoModule, FaviconModule, DiscordModule],
})
export class IntegrationsModule { }
