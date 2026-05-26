import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResendConfigService {
    constructor(private configService: ConfigService) { }

    getResendApiKey(): string {
        return this.configService.getOrThrow<string>('RESEND_API_KEY');
    }

    getSenderEmail(): string {
        return this.configService.getOrThrow<string>('RESEND_SENDER_EMAIL');
    }
}
