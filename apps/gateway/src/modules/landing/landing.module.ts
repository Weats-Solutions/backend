import { Module } from '@nestjs/common';
import { ClientProxyFactory } from '@nestjs/microservices';
import { GatewayConfigService } from '@weats/configs/gateway-config.service';
import { LANDING_SERVICE } from '@weats/common';
import { ConfigsModule } from '@weats/configs';
import { IntegrationsModule } from '@weats/integrations';
import { DatabaseModule } from '@weats/database';
import { ContactController } from './controllers/contact.controller';


@Module({
    imports: [ConfigsModule, IntegrationsModule, DatabaseModule],
    providers: [
        {
            provide: LANDING_SERVICE,
            useFactory: (configService: GatewayConfigService) => {
                const clientOptions = configService.landingClientOptions;
                return ClientProxyFactory.create(clientOptions);
            },
            inject: [GatewayConfigService],
        },
    ],
    controllers: [
        ContactController,
    ],
})
export class LandingModule { }
