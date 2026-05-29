import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common';
import { QrCodesService } from './qr-codes.service';
import { GenerateQrCodesDto, UpdateQrCodeDto, BulkUpdateQrCodesDto, BulkDeleteQrCodesDto, ResendQrCodesDto } from '@weats/contracts';
import { Establishment } from '@weats/types';

@Controller()
export class QrCodesController {
    constructor(private readonly qrCodesService: QrCodesService) { }

    @MessagePattern(DASHBOARD_PATTERNS.QR_GET_ALL)
    async getQrCodes(
        @Payload() payload: {
            establishmentId: string;
        },
    ) {
        return this.qrCodesService.findAll(payload.establishmentId);
    }

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

    @MessagePattern(DASHBOARD_PATTERNS.QR_UPDATE)
    async updateQrCode(
        @Payload() payload: {
            id: string;
            dto: UpdateQrCodeDto;
            establishment: Establishment;
        },
    ) {
        return this.qrCodesService.update(
            payload.id,
            payload.dto,
            payload.establishment,
        );
    }

    @MessagePattern(DASHBOARD_PATTERNS.QR_DELETE)
    async deleteQrCode(
        @Payload() payload: {
            id: string;
            establishment: Establishment;
        },
    ) {
        return this.qrCodesService.delete(
            payload.id,
            payload.establishment,
        );
    }

    @MessagePattern(DASHBOARD_PATTERNS.QR_BULK_UPDATE)
    async bulkUpdateQrCodes(
        @Payload() payload: {
            dto: BulkUpdateQrCodesDto;
            establishment: Establishment;
        },
    ) {
        return this.qrCodesService.bulkUpdate(
            payload.dto.ids,
            payload.dto.data,
            payload.establishment,
        );
    }

    @MessagePattern(DASHBOARD_PATTERNS.QR_BULK_DELETE)
    async bulkDeleteQrCodes(
        @Payload() payload: {
            dto: BulkDeleteQrCodesDto;
            establishment: Establishment;
        },
    ) {
        return this.qrCodesService.bulkDelete(
            payload.dto.ids,
            payload.establishment,
        );
    }

    @MessagePattern(DASHBOARD_PATTERNS.QR_RESEND)
    async resendQrCodes(
        @Payload() payload: {
            dto: ResendQrCodesDto;
            establishment: Establishment;
            userEmail: string;
        },
    ) {
        return this.qrCodesService.resendQrCodes(
            payload.dto,
            payload.establishment,
            payload.userEmail,
        );
    }
}
