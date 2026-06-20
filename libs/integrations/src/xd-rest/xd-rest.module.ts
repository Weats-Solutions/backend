import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '@weats/database';
import { EncryptionModule } from '@weats/encryption';
import { XdRestService } from './xd-rest.service';

import { IntegrationsValidationModule } from '../validation/integrations-validation.module';

@Module({
    imports: [HttpModule, DatabaseModule, EncryptionModule, IntegrationsValidationModule],
    providers: [XdRestService],
    exports: [XdRestService],
})
export class XdRestModule { }
