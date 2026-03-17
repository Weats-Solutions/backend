import { Module } from '@nestjs/common';
import { WebhooksController } from './webhook.controller';
import { GatewayConfigService } from '@weats/configs';
import { ClientProxyFactory } from '@nestjs/microservices';
import { WEBHOOK_SERVICE } from '@weats/common';
import { ConfigsModule } from '@weats/configs';

@Module({
    imports: [ConfigsModule],
    controllers: [WebhooksController],
    providers: [
        {
            provide: WEBHOOK_SERVICE,
            useFactory: (configService: GatewayConfigService) => {
                const clientOptions = configService.webhooksClientOptions;
                return ClientProxyFactory.create(clientOptions);
            },
            inject: [GatewayConfigService],
        },
    ],
})
export class WebhooksModule { }
