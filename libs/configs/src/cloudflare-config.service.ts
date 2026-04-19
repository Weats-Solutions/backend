import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudflareConfigService {
    constructor(private configService: ConfigService) { }

    getAccountId(): string {
        return this.configService.getOrThrow<string>('CLOUDFLARE_IMAGES_ACCOUNT_ID');
    }

    getApiToken(): string {
        return this.configService.getOrThrow<string>('CLOUDFLARE_IMAGES_API_TOKEN');
    }

    getAccountHash(): string {
        return this.configService.getOrThrow<string>('CLOUDFLARE_IMAGES_ACCOUNT_HASH');
    }

    getBaseUrl(): string {
        return `https://api.cloudflare.com/client/v4/accounts/${this.getAccountId()}/images/v1`;
    }

    getCDNUrl(): string {
        return this.configService.getOrThrow<string>('CLOUDFLARE_CDN_URL');
    }

    getDirectUploadUrl() {
        return `https://api.cloudflare.com/client/v4/accounts/${this.getAccountId()}/images/v2/direct_upload`;
    }

    getR2ImagesS3Endpoint(): string {
        return this.configService.getOrThrow<string>('R2_IMAGES_BUCKET_S3_ENDPOINT');
    }

    getR2ImagesBucketName(): string {
        return this.configService.getOrThrow<string>('R2_IMAGES_BUCKET_NAME');
    }

    getR2ImagesBucketAccessKey(): string {
        return this.configService.getOrThrow<string>('R2_IMAGES_BUCKET_ACCESS_KEY');
    }

    getR2ImagesBucketSecretKey(): string {
        return this.configService.getOrThrow<string>('R2_IMAGES_BUCKET_SECRET_KEY');
    }

    getR2ImagesBucketURL(): string {
        return this.configService.getOrThrow<string>('R2_IMAGES_BUCKET_URL');
    }
}

