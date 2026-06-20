import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '@weats/database';
import { EncryptionModule } from '@weats/encryption';
import { XdRestService } from './xd-rest.service';

@Module({
    imports: [HttpModule, DatabaseModule, EncryptionModule],
    providers: [XdRestService],
    exports: [XdRestService],
})
export class XdRestModule { }
