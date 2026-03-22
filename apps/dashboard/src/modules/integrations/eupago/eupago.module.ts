import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { EupagoIntegrationController } from './eupago.controller';
import { IntegrationsModule } from '@weats/integrations';

@Module({
    imports: [
        DatabaseModule,
        IntegrationsModule,
    ],
    controllers: [EupagoIntegrationController],
    providers: [
    ],
    exports: [],
})
export class EupagoModule { }
