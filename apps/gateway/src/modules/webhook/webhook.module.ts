import { Module } from '@nestjs/common';
import { WebhooksController } from './webhook.controller';
import { ConfigsModule, RedisConfigService } from '@weats/configs';
import { IntegrationsModule } from '@weats/integrations';
import { BullModule, BullModuleOptions } from '@nestjs/bull';

@Module({
    imports: [
        ConfigsModule,
        IntegrationsModule,
        BullModule.registerQueueAsync({
            name: 'webhooks-queue',
            imports: [ConfigsModule],
            inject: [RedisConfigService],
            useFactory: async (
                redisConfig: RedisConfigService,
            ): Promise<BullModuleOptions> => ({
                redis: redisConfig.getConnectionOptions('webhooks'),
            }),
        }),
    ],
    controllers: [WebhooksController],
    providers: [],
})
export class WebhooksModule { }
