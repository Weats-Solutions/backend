import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { DiscordConfigService, ConfigsModule } from '@weats/configs';
import { HttpModule } from '@nestjs/axios';

@Module({
    providers: [
        DiscordService,
        {
            provide: 'DISCORD_WEBHOOK_URL',
            useFactory: async (discordConfig: DiscordConfigService) =>
                discordConfig.getWebhookUrl(),
            inject: [DiscordConfigService],
        },

    ],
    imports: [HttpModule, ConfigsModule],
    exports: [DiscordService],
})
export class DiscordModule { }
