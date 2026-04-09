import { Module } from '@nestjs/common';
import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { RedisConfigService } from '@weats/configs/redis-config.service';

import { ConfigsModule } from '@weats/configs';
import { FaviconService } from './favicon.service';
import { FaviconProcessor } from './favicon.processor';
import { DatabaseModule } from '@weats/database';
import { IntegrationsModule } from '@weats/integrations';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        ConfigModule,
        ConfigsModule,
        DatabaseModule,
        IntegrationsModule,
        HttpModule,
        BullModule.registerQueueAsync({
            name: 'jobs',
            imports: [ConfigsModule],
            inject: [RedisConfigService],
            useFactory: async (
                redisConfig: RedisConfigService,
            ): Promise<BullModuleOptions> => ({
                redis: redisConfig.getConnectionOptions('jobs'),
            }),
        }),
    ],
    providers: [
        FaviconService,
        FaviconProcessor,
    ],
    exports: [FaviconService],
})
export class FaviconModule { }
