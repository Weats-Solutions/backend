import { Controller, Post, Get, Delete, Patch, Body, UseGuards, Inject } from '@nestjs/common';
import { CurrentEstablishment, ClerkGuard, EstablishmentStaffGuard, Roles } from '@weats/common';
import { EupagoConfigGuard } from '@weats/common/guards/eupago-config.guard';
import { Establishment } from '@weats/types';
import { SaveEupagoKeyDto, SaveEupagoCryptoKeyDto, EupagoCreatePaymentDto, EupagoCreateMbwayPaymentDto, EupagoCreateHostedPaymentDto } from '@weats/contracts/dashboard/dtos/eupago';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_SERVICE } from '@weats/common/constants';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';

@Roles()

@Controller('integrations/eupago')
export class EupagoIntegrationController {
    constructor(
        @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
    ) { }

    // ─── API Key ─────────────────────────────────────────────────────────────

    /**
     * GET /v1/integrations/eupago/key
     * Returns the connection status and masked key for the establishment.
     */
    @Get('key')
    getStatus(@CurrentEstablishment() establishment: Establishment) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.EUPAGO_GET_STATUS, establishment.id);
    }

    /**
     * POST /v1/integrations/eupago/key
     * Saves (or replaces) the EuPago API key for the establishment.
     */
    @Post('key')
    saveKey(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: SaveEupagoKeyDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.EUPAGO_SAVE_KEY, { establishmentId: establishment.id, dto });
    }

    /**
     * DELETE /v1/integrations/eupago/key
     * Removes the EuPago API key and disables the integration.
     */
    @Delete('key')
    deleteKey(@CurrentEstablishment() establishment: Establishment) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.EUPAGO_DELETE_KEY, establishment.id);
    }

    /**
     * PATCH /v1/integrations/eupago/toggle
     * Enables or disables the EuPago integration without touching credentials.
     * Body: { enabled: boolean }
     */
    @Patch('toggle')
    toggle(
        @CurrentEstablishment() establishment: Establishment,
        @Body('enabled') enabled: boolean,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.EUPAGO_TOGGLE, { establishmentId: establishment.id, enabled });
    }

    // ─── Crypto Key (Chave Criptográfica dos webhooks) ────────────────────────

    /**
     * POST /v1/integrations/eupago/crypto-key
     * Saves (or replaces) the Chave Criptográfica gerada no backoffice EuPago.
     * Usada para verificar HMAC-SHA256 e desencriptar AES-256-CBC nos webhooks.
     */
    @Post('crypto-key')
    saveCryptoKey(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: SaveEupagoCryptoKeyDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.EUPAGO_SAVE_CRYPTO_KEY, { establishmentId: establishment.id, cryptoKey: dto.cryptoKey });
    }

    /**
     * DELETE /v1/integrations/eupago/crypto-key
     * Removes the stored Chave Criptográfica.
     */
    @Delete('crypto-key')
    deleteCryptoKey(@CurrentEstablishment() establishment: Establishment) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.EUPAGO_DELETE_CRYPTO_KEY, establishment.id);
    }

    // ─── Credit Card Payment ──────────────────────────────────────────────────

    /**
     * POST /v1/integrations/eupago/credit-card/generate
     * Creates a hosted checkout URL for a Credit Card payment (3D Secure).
     * Requires valid EuPago configuration.
     * Returns { url, referencia? } — redirect the customer to `url` to pay.
     */

    // ─── Hosted Payment (Generic) ───────────────────────────────────────────
    /**
     * POST /v1/integrations/eupago/hosted-payment
     * Generates a hosted checkout URL for Credit Card, Google Pay or Apple Pay.
     */
    @Post('hosted-payment')
    @UseGuards(EupagoConfigGuard)
    generateHostedPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: EupagoCreateHostedPaymentDto,
    ) {
        const typePrefixes = {
            CreditCard: 'cc',
            GooglePay: 'gp',
            ApplePay: 'ap'
        };

        return this.dashboardClient.send(DASHBOARD_PATTERNS.EUPAGO_GENERATE_HOSTED_PAYMENT, {
            establishment,
            type: dto.type,
            identifier: `${typePrefixes[dto.type]}-${establishment.id}`,
            dto
        });
    }

    // ─── MB WAY Payment ───────────────────────────────────────────────────────

    /**
     * POST /v1/integrations/eupago/mbway/generate
     * Sends a MB WAY push notification to the customer's phone.
     * Requires valid EuPago configuration.
     * Returns { transactionID, referencia? } — no redirect URL.
     */
    @Post('mbway/generate')
    @UseGuards(EupagoConfigGuard)
    generateMbwayPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: EupagoCreateMbwayPaymentDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.EUPAGO_GENERATE_MBWAY_PAYMENT, {
            establishment,
            identifier: `mbw-${establishment.id}`,
            dto
        });
    }
}
