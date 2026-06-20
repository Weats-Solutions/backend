import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { XdRestIntegrationController } from './xd-rest.controller';
import { IntegrationsModule } from '@weats/integrations';

@Module({
    imports: [
        DatabaseModule,
        IntegrationsModule,
    ],
    controllers: [XdRestIntegrationController],
    providers: [],
    exports: [],
})
export class XdRestModule { }
