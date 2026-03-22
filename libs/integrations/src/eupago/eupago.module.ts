import { Module } from "@nestjs/common";
import { ConfigsModule } from "@weats/configs";
import { HttpModule } from "@nestjs/axios";
import { EupagoConfigService } from "@weats/configs/eupago-config.service";
import { EupagoService } from "./eupago.service";
import { EupagoConfigGuard } from "../../../common/src/guards/eupago-config.guard";
import { DatabaseModule } from "@weats/database";
import { EncryptionModule } from "@weats/encryption";

@Module({
    imports: [HttpModule, ConfigsModule, DatabaseModule, EncryptionModule],
    providers: [EupagoService, EupagoConfigGuard,
        {
            provide: 'EUPAGO_API_URL',
            useFactory: async (eupagoConfig: EupagoConfigService) =>
                eupagoConfig.getEupagoApiUrl(),
            inject: [EupagoConfigService],
        },
    ],
    exports: [
        EupagoService,
        EupagoConfigGuard,
        'EUPAGO_API_URL',
    ],
})
export class EupagoModule { }
