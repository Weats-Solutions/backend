import { SaveEupagoKeyDto, SaveEupagoCryptoKeyDto, EupagoCreatePaymentDto, EupagoCreateMbwayPaymentDto, EupagoCreateHostedPaymentDto } from '@weats/contracts/dashboard/dtos/eupago';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { Controller } from '@nestjs/common';
import { EupagoService } from '@weats/integrations/eupago/eupago.service';
import { Establishment } from '@weats/types';

@Controller()
export class EupagoIntegrationController {
    constructor(
        private readonly eupagoService: EupagoService
    ) { }

    // ─── API Key ─────────────────────────────────────────────────────────────

    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_GET_STATUS)
    getStatus(@Payload() establishmentId: string) {
        return this.eupagoService.getStatus(establishmentId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_SAVE_KEY)
    saveKey(
        @Payload() payload: { establishmentId: string, dto: SaveEupagoKeyDto },
    ) {
        return this.eupagoService.saveKey(payload.establishmentId, payload.dto.apiKey);
    }

    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_DELETE_KEY)
    deleteKey(@Payload() establishmentId: string) {
        return this.eupagoService.deleteKey(establishmentId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_TOGGLE)
    toggle(
        @Payload() payload: { establishmentId: string, enabled: boolean },
    ) {
        return this.eupagoService.toggle(payload.establishmentId, payload.enabled);
    }

    // ─── Crypto Key (Chave Criptográfica dos webhooks) ────────────────────────

    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_SAVE_CRYPTO_KEY)
    saveCryptoKey(
        @Payload() payload: { establishmentId: string, dto: SaveEupagoCryptoKeyDto },
    ) {
        return this.eupagoService.saveCryptoKey(payload.establishmentId, payload.dto.cryptoKey);
    }

    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_DELETE_CRYPTO_KEY)
    deleteCryptoKey(@Payload() establishmentId: string) {
        return this.eupagoService.deleteCryptoKey(establishmentId);
    }

    // ─── Hosted Payment (Generic: CC, Google Pay, Apple Pay) ────────────────

    /**
     * POST /v1/integrations/eupago/hosted-payment
     */
    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_GENERATE_HOSTED_PAYMENT)
    async generateHostedPayment(
        @Payload() payload: { 
            establishment: Establishment, 
            type: 'CreditCard' | 'GooglePay' | 'ApplePay', 
            identifier: string, 
            dto: EupagoCreateHostedPaymentDto 
        },
    ) {
        return this.eupagoService.createHostedPayment(
            payload.type, 
            payload.establishment, 
            payload.identifier, 
            payload.dto
        );
    }

    // ─── MB WAY Payment ───────────────────────────────────────────────────────

    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_GENERATE_MBWAY_PAYMENT)
    async generateMbwayPayment(
        @Payload() payload: { establishment: Establishment, identifier: string, dto: EupagoCreateMbwayPaymentDto },
    ) {
        return this.eupagoService.createMbwayPayment(payload.establishment, payload.identifier, payload.dto);
    }
}
