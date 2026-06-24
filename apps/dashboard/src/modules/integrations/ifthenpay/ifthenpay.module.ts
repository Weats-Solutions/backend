import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { IfthenpayIntegrationController } from './ifthenpay.controller';
import { IntegrationsModule } from '@weats/integrations';

@Module({
    imports: [
        DatabaseModule,
        IntegrationsModule,
    ],
    controllers: [IfthenpayIntegrationController],
    providers: [],
    exports: [],
})
export class IfthenpayModule { }
