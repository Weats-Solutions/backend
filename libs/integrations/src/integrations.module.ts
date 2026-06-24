import { Module } from '@nestjs/common';
import { ClerkModule } from './clerk/clerk.module';
import { StripeModule } from './stripe/stripe.module';
import { CloudflareModule } from './cloudflare/cloudflare.module';
import { EupagoModule } from './eupago/eupago.module';
import { IfthenpayModule } from './ifthenpay/ifthenpay.module';
import { FaviconModule } from './favicon/favicon.module';
import { DiscordModule } from './discord/discord.module';
import { XdRestModule } from './xd-rest/xd-rest.module';

import { IntegrationsValidationModule } from './validation/integrations-validation.module';

@Module({
  imports: [ClerkModule, StripeModule, CloudflareModule, EupagoModule, IfthenpayModule, FaviconModule, DiscordModule, XdRestModule, IntegrationsValidationModule],
  exports: [ClerkModule, StripeModule, CloudflareModule, EupagoModule, IfthenpayModule, FaviconModule, DiscordModule, XdRestModule, IntegrationsValidationModule],
})
export class IntegrationsModule { }
