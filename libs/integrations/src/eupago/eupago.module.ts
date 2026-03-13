import { Module } from "@nestjs/common";
import { ConfigsModule } from "@weats/configs";
import { HttpModule } from "@nestjs/axios";
import { EupagoConfigService } from "@weats/configs/eupago-config.service";
import { EupagoService } from "./eupage.service";

@Module({
    imports: [HttpModule, ConfigsModule],
    providers: [EupagoService,
        {
            provide: 'EUPAGO_API_URL',
            useFactory: async (eupagoConfig: EupagoConfigService) =>
                eupagoConfig.getEupagoApiUrl(),
            inject: [EupagoConfigService],
        },
    ],
    exports: [
        EupagoService,
        'EUPAGO_API_URL',
    ],
})
export class EupagoModule { }