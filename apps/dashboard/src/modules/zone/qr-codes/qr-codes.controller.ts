import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common';
import { QrCodesService } from './qr-codes.service';
import { GenerateQrCodesDto } from '@weats/contracts';

@Controller()
export class QrCodesController {
    constructor(private readonly qrCodesService: QrCodesService) { }

    @MessagePattern(DASHBOARD_PATTERNS.QR_GENERATE)
    async generateQrCodes(
        @Payload() payload: {
            dto: GenerateQrCodesDto;
            establishmentId: string;
            userEmail: string;
        },
    ) {
        return this.qrCodesService.generateQrCodes(
            payload.dto,
            payload.establishmentId,
            payload.userEmail,
        );
    }
}
