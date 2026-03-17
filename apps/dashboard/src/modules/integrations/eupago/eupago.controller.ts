import { SaveEupagoKeyDto, SaveEupagoCryptoKeyDto, EupagoCreatePaymentDto, EupagoCreateMbwayPaymentDto } from '@weats/contracts/dashboard/dtos/eupago';
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

    /**
     * GET /v1/integrations/eupago/key
     * Returns the connection status and masked key for the establishment.
     */
    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_GET_STATUS)
    getStatus(@Payload() establishmentId: string) {
        return this.eupagoService.getStatus(establishmentId);
    }

    /**
     * POST /v1/integrations/eupago/key
     * Saves (or replaces) the EuPago API key for the establishment.
     */
    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_SAVE_KEY)
    saveKey(
        @Payload() payload: { establishmentId: string, dto: SaveEupagoKeyDto },
    ) {
        return this.eupagoService.saveKey(payload.establishmentId, payload.dto.apiKey);
    }

    /**
     * DELETE /v1/integrations/eupago/key
     * Removes the EuPago API key and disables the integration.
     */
    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_DELETE_KEY)
    deleteKey(@Payload() establishmentId: string) {
        return this.eupagoService.deleteKey(establishmentId);
    }

    /**
     * PATCH /v1/integrations/eupago/toggle
     * Enables or disables the EuPago integration without touching credentials.
     * Body: { enabled: boolean }
     */
    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_TOGGLE)
    toggle(
        @Payload() payload: { establishmentId: string, enabled: boolean },
    ) {
        return this.eupagoService.toggle(payload.establishmentId, payload.enabled);
    }

    // ─── Crypto Key (Chave Criptográfica dos webhooks) ────────────────────────

    /**
     * POST /v1/integrations/eupago/crypto-key
     * Saves (or replaces) the Chave Criptográfica gerada no backoffice EuPago.
     * Usada para verificar HMAC-SHA256 e desencriptar AES-256-CBC nos webhooks.
     */
    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_SAVE_CRYPTO_KEY)
    saveCryptoKey(
        @Payload() payload: { establishmentId: string, dto: SaveEupagoCryptoKeyDto },
    ) {
        return this.eupagoService.saveCryptoKey(payload.establishmentId, payload.dto.cryptoKey);
    }

    /**
     * DELETE /v1/integrations/eupago/crypto-key
     * Removes the stored Chave Criptográfica.
     */
    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_DELETE_CRYPTO_KEY)
    deleteCryptoKey(@Payload() establishmentId: string) {
        return this.eupagoService.deleteCryptoKey(establishmentId);
    }

    // ─── Credit Card Payment ──────────────────────────────────────────────────

    /**
     * POST /v1/integrations/eupago/credit-card/generate
     * Generates a hosted checkout URL for a Credit Card payment (3D Secure).
     * Returns { url, referencia? } — redirect the customer to `url` to pay.
     */
    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_GENERATE_CREDIT_CARD_PAYMENT)
    async generateCreditCardPayment(
        @Payload() payload: { establishment: Establishment, identifier: string, dto: EupagoCreatePaymentDto },
    ) {
        return this.eupagoService.createCreditCardPayment(payload.establishment, payload.identifier, payload.dto);
    }

    // ─── Google Pay Payment ───────────────────────────────────────────────────

    /**
     * POST /v1/integrations/eupago/google-pay/generate
     * Generates a hosted checkout URL for a Google Pay payment.
     * Returns { url, referencia? } — redirect the customer to `url` to pay.
     */
    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_GENERATE_GOOGLE_PAY_PAYMENT)
    async generateGooglePayPayment(
        @Payload() payload: { establishment: Establishment, identifier: string, dto: EupagoCreatePaymentDto },
    ) {
        return this.eupagoService.createGooglePayPayment(payload.establishment, payload.identifier, payload.dto);
    }

    // ─── Apple Pay Payment ────────────────────────────────────────────────────

    /**
     * POST /v1/integrations/eupago/apple-pay/generate
     * Generates a hosted checkout URL for an Apple Pay payment.
     * Returns { url, referencia? } — redirect the customer to `url` to pay.
     */
    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_GENERATE_APPLE_PAY_PAYMENT)
    async generateApplePayPayment(
        @Payload() payload: { establishment: Establishment, identifier: string, dto: EupagoCreatePaymentDto },
    ) {
        return this.eupagoService.createApplePayPayment(payload.establishment, payload.identifier, payload.dto);
    }

    // ─── MB WAY Payment ───────────────────────────────────────────────────────

    /**
     * POST /v1/integrations/eupago/mbway/generate
     * Sends a MB WAY push notification to the customer's phone.
     * Returns { transactionID, referencia? } — no redirect URL.
     */
    @MessagePattern(DASHBOARD_PATTERNS.EUPAGO_GENERATE_MBWAY_PAYMENT)
    async generateMbwayPayment(
        @Payload() payload: { establishment: Establishment, identifier: string, dto: EupagoCreateMbwayPaymentDto },
    ) {
        return this.eupagoService.createMbwayPayment(payload.establishment, payload.identifier, payload.dto);
    }
}
