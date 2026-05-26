import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type DiscordWebhookType = 'email' | 'stripe' | 'clerk';

export const DISCORD_WEBHOOK_URL_MAP: Record<DiscordWebhookType, string> = {
    email: 'DISCORD_EMAIL_WEBHOOK_URL',
    stripe: 'DISCORD_STRIPE_WEBHOOK_URL',
    clerk: 'DISCORD_CLERK_WEBHOOK_URL',
};

@Injectable()
export class DiscordConfigService {
    constructor(private configService: ConfigService) { }


    getWebhookUrl(type: DiscordWebhookType): string {
        return this.configService.getOrThrow<string>(DISCORD_WEBHOOK_URL_MAP[type]);
    }
}
