import { Module } from '@nestjs/common';
import { WebhooksController } from './webhook.controller';
import { ConfigsModule, RedisConfigService } from '@weats/configs';
import { IntegrationsModule } from '@weats/integrations';
import { QueuesModule } from '@weats/bull';

@Module({
    imports: [
        ConfigsModule,
        IntegrationsModule,
        QueuesModule,
    ],
    controllers: [WebhooksController],
    providers: [],
})
export class WebhooksModule { }
