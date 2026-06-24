import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { EupagoIntegrationController } from './eupago.controller';
import { IntegrationsModule } from '@weats/integrations';
import { EncryptionModule } from '@weats/encryption';

@Module({
    imports: [
        DatabaseModule,
        IntegrationsModule,
        EncryptionModule,
    ],
    controllers: [EupagoIntegrationController],
    providers: [
    ],
    exports: [],
})
export class EupagoModule { }
