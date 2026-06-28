import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { IfthenpayIntegrationController } from './ifthenpay.controller';
import { IntegrationsModule } from '@weats/integrations';
import { EncryptionModule } from '@weats/encryption';

@Module({
    imports: [
        DatabaseModule,
        IntegrationsModule,
        EncryptionModule,
    ],
    controllers: [IfthenpayIntegrationController],
    providers: [],
    exports: [],
})
export class IfthenpayModule { }
