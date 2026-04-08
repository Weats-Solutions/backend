import { Module } from "@nestjs/common";
import { CloudflareService } from "./cloudflare.service";
import { CloudflareConfigService, ConfigsModule } from "@weats/configs";
import { HttpModule } from "@nestjs/axios";
import { DatabaseModule } from "@weats/database";

@Module({
    imports: [HttpModule, ConfigsModule, DatabaseModule,
    ],
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
        {
            provide: 'CLOUDFLARE_CDN_URL',
            useFactory: async (cloudflareConfig: CloudflareConfigService) =>
                cloudflareConfig.getCDNUrl(),
            inject: [CloudflareConfigService],
        },
    ],
    exports: [
        CloudflareService,
        'ACCOUNT_ID',
        'API_TOKEN',
        'BASE_URL',
        'DIRECT_UPLOAD_URL',
        'CLOUDFLARE_CDN_URL',
    ],
})
export class CloudflareModule { }