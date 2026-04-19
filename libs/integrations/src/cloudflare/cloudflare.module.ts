import { Module } from "@nestjs/common";
import { CloudflareService } from "./cloudflare.service";
import { CloudflareConfigService, ConfigsModule } from "@weats/configs";
import { HttpModule } from "@nestjs/axios";
import { DatabaseModule } from "@weats/database";
import { CloudflareR2Service } from "./cloudflare-r2.service";

@Module({
    imports: [HttpModule, ConfigsModule, DatabaseModule,
    ],
    providers: [CloudflareService, CloudflareR2Service,
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
        {
            provide: 'R2_IMAGES_BUCKET_ACCESS_KEY',
            useFactory: async (cloudflareConfig: CloudflareConfigService) =>
                cloudflareConfig.getR2ImagesBucketAccessKey(),
            inject: [CloudflareConfigService],
        },
        {
            provide: 'R2_IMAGES_BUCKET_SECRET_KEY',
            useFactory: async (cloudflareConfig: CloudflareConfigService) =>
                cloudflareConfig.getR2ImagesBucketSecretKey(),
            inject: [CloudflareConfigService],
        },
        {
            provide: 'R2_IMAGES_BUCKET_NAME',
            useFactory: async (cloudflareConfig: CloudflareConfigService) =>
                cloudflareConfig.getR2ImagesBucketName(),
            inject: [CloudflareConfigService],
        },
        {
            provide: 'R2_IMAGES_BUCKET_S3_ENDPOINT',
            useFactory: async (cloudflareConfig: CloudflareConfigService) =>
                cloudflareConfig.getR2ImagesS3Endpoint(),
            inject: [CloudflareConfigService],
        },
        {
            provide: 'R2_IMAGES_BUCKET_URL',
            useFactory: async (cloudflareConfig: CloudflareConfigService) =>
                cloudflareConfig.getR2ImagesBucketURL(),
            inject: [CloudflareConfigService],
        },
    ],
    exports: [
        CloudflareService,
        CloudflareR2Service,
        'ACCOUNT_ID',
        'API_TOKEN',
        'BASE_URL',
        'DIRECT_UPLOAD_URL',
        'CLOUDFLARE_CDN_URL',
        'R2_IMAGES_BUCKET_URL',
    ],
})
export class CloudflareModule { }