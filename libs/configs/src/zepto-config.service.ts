import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ZeptoConfigService {
    constructor(private configService: ConfigService) { }

    getZeptoApiUrl(): string {
        return this.configService.getOrThrow<string>('ZEPTO_API_URL');
    }

    getZeptoENCZAPIKEY(): string {
        return this.configService.getOrThrow<string>('ZEPTO_ZOHO_ENCZAPIKEY');
    }

    getSenderEmail(): string | undefined {
        return this.configService.getOrThrow<string>('ZEPTO_SENDER_EMAIL');
    }
}
