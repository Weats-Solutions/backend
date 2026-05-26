import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { DiscordConfigService, ConfigsModule } from '@weats/configs';
import { HttpModule } from '@nestjs/axios';

@Module({
    providers: [
        DiscordService
    ],
    imports: [HttpModule, ConfigsModule],
    exports: [DiscordService],
})
export class DiscordModule { }
