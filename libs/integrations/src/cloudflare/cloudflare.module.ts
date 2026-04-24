import { Module } from "@nestjs/common";
import { CloudflareConfigService, ConfigsModule } from "@weats/configs";
import { HttpModule } from "@nestjs/axios";
import { DatabaseModule } from "@weats/database";
import { CloudflareR2Service } from "./cloudflare-r2.service";

@Module({
    imports: [HttpModule, ConfigsModule, DatabaseModule,
    ],
    providers: [CloudflareR2Service,
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
        {
            provide: 'R2_CDN_URL',
            useFactory: async (cloudflareConfig: CloudflareConfigService) =>
                cloudflareConfig.getR2CdnURL(),
            inject: [CloudflareConfigService],
        },
    ],
    exports: [
        CloudflareR2Service,
        'R2_CDN_URL',
    ],
})
export class CloudflareModule { }