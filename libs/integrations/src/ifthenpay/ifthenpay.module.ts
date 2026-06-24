import { Module } from "@nestjs/common";
import { DatabaseModule } from "@weats/database";
import { EncryptionModule } from "@weats/encryption";
import { IntegrationsValidationModule } from "../validation/integrations-validation.module";
import { IfthenpayService } from "./ifthenpay.service";
import { IfthenpayConfigGuard } from "../../../common/src/guards/ifthenpay-config.guard";

@Module({
    imports: [DatabaseModule, EncryptionModule, IntegrationsValidationModule],
    providers: [IfthenpayService, IfthenpayConfigGuard],
    exports: [
        IfthenpayService,
        IfthenpayConfigGuard,
    ],
})
export class IfthenpayModule { }
