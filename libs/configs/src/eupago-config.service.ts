import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EuPagoEnvironment } from '@weats/types';

@Injectable()
export class EupagoConfigService {
    constructor(private configService: ConfigService) { }

    getEupagoApiUrl(): string {
        return this.configService.getOrThrow<string>('EUPAGO_API_URL');
    }

    getEupagoEnvironment(): EuPagoEnvironment {
        const eupagoUrl = this.getEupagoApiUrl();
        if (eupagoUrl.includes('sandbox')) {
            return 'sandbox';
        } else {
            return 'production';
        }
    }
}

