import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudflareConfigService {
    constructor(private configService: ConfigService) { }

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

    getR2CdnURL(): string {
        return this.configService.getOrThrow<string>('R2_CDN_URL');
    }
}

