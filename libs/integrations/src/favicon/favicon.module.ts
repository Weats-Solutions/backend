import { Module } from '@nestjs/common';
import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { RedisConfigService } from '@weats/configs/redis-config.service';

import { ConfigsModule } from '@weats/configs';
import { FaviconService } from './favicon.service';
import { FaviconProcessor } from './favicon.processor';
import { DatabaseModule } from '@weats/database';
import { CloudflareModule } from '../cloudflare/cloudflare.module';
import { HttpModule } from '@nestjs/axios';
import { QueuesModule } from '@weats/bull';

@Module({
    imports: [
        QueuesModule,
        ConfigModule,
        ConfigsModule,
        DatabaseModule,
        CloudflareModule,
        HttpModule,

    ],
    providers: [
        FaviconService,
        FaviconProcessor,
    ],
    exports: [FaviconService],
})
export class FaviconModule { }
