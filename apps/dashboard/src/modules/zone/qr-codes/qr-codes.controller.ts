import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common';
import { QrCodesService } from './qr-codes.service';
import { GenerateQrCodesDto } from '@weats/contracts';
import { Establishment } from '@weats/types';

@Controller()
export class QrCodesController {
    constructor(private readonly qrCodesService: QrCodesService) { }

    @MessagePattern(DASHBOARD_PATTERNS.QR_GENERATE)
    async generateQrCodes(
        @Payload() payload: {
            dto: GenerateQrCodesDto;
            establishment: Establishment;
            userEmail: string;
        },
    ) {
        return this.qrCodesService.generateQrCodes(
            payload.dto,
            payload.establishment,
            payload.userEmail,
        );
    }
}
