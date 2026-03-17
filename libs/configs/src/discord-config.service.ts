import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordConfigService {
    constructor(private configService: ConfigService) { }

    getWebhookUrl(): string {
        return this.configService.getOrThrow<string>('DISCORD_WEBHOOK_URL');
    }
}

