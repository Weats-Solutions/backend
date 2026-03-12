import { Module } from "@nestjs/common";
import { CloudflareService } from "./cloudflare.service";
import { CloudflareConfigService } from "@weats/configs/cloudflare-config.service";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [HttpModule],
    providers: [CloudflareService,
        {
            provide: 'ACCOUNT_ID',
            useFactory: async (cloudflareConfig: CloudflareConfigService) =>
                cloudflareConfig.getAccountId(),
            inject: [CloudflareConfigService],
        },
        {
            provide: 'API_TOKEN',
            useFactory: async (cloudflareConfig: CloudflareConfigService) =>
                cloudflareConfig.getApiToken(),
            inject: [CloudflareConfigService],
        },
        {
            provide: 'BASE_URL',
            useFactory: async (cloudflareConfig: CloudflareConfigService) =>
                cloudflareConfig.getBaseUrl(),
            inject: [CloudflareConfigService],
        },
        {
            provide: 'DIRECT_UPLOAD_URL',
            useFactory: async (cloudflareConfig: CloudflareConfigService) =>
                cloudflareConfig.getDirectUploadUrl(),
            inject: [CloudflareConfigService],
        },
    ],
    exports: [CloudflareService],
})
export class CloudflareModule { }