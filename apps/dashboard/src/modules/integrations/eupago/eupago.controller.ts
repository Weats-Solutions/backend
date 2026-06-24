import { SaveEupagoKeyDto, SaveEupagoCryptoKeyDto, EupagoCreatePaymentDto, EupagoCreateMbwayPaymentDto, EupagoCreateHostedPaymentDto } from '@weats/contracts/dashboard/dtos/eupago';
import { Controller, Post, Get, Delete, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiAuthenticated, CurrentEstablishment, Roles, EupagoConfigGuard } from '@weats/common';
import { EupagoService } from '@weats/integrations/eupago/eupago.service';
import { Establishment } from '@weats/types';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Integrations - EuPago')
@Roles()
@Controller('integrations/eupago')
export class EupagoIntegrationController {
    constructor(
        private readonly eupagoService: EupagoService
    ) { }

    // ─── API Key ─────────────────────────────────────────────────────────────

    /**
     * GET /v1/integrations/eupago/key
     * Returns the connection status and masked key for the establishment.
     */
    @Get('key')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter estado e chave mascarada da integração EuPago' })
    @ApiOkResponse({ description: 'Estado da integração obtido com sucesso' })
    getStatus(@CurrentEstablishment() establishment: Establishment) {
        return this.eupagoService.getStatus(establishment.id);
    }

    /**
     * POST /v1/integrations/eupago/key
     * Saves (or replaces) the EuPago API key for the establishment.
     */
    @Post('key')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gravar chave API da EuPago' })
    @ApiCreatedResponse({ description: 'Chave API gravada com sucesso' })
    saveKey(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: SaveEupagoKeyDto,
    ) {
        return this.eupagoService.saveKey(establishment.id, dto.apiKey);
    }

    /**
     * DELETE /v1/integrations/eupago/key
     * Removes the EuPago API key and disables the integration.
     */
    @Delete('key')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Remover chave API da EuPago' })
    @ApiOkResponse({ description: 'Chave API removida com sucesso' })
    deleteKey(@CurrentEstablishment() establishment: Establishment) {
        return this.eupagoService.deleteKey(establishment.id);
    }

    /**
     * PATCH /v1/integrations/eupago/toggle
     * Enables or disables the EuPago integration without touching credentials.
     */
    @Patch('toggle')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Ativar ou desativar a integração EuPago' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean', description: 'Ativar/desativar a integração' }
            },
            required: ['enabled']
        }
    })
    @ApiOkResponse({ description: 'Integração alternada com sucesso' })
    toggle(
        @CurrentEstablishment() establishment: Establishment,
        @Body('enabled') enabled: boolean,
    ) {
        return this.eupagoService.toggle(establishment.id, enabled);
    }

    // ─── Crypto Key (Chave Criptográfica dos webhooks) ────────────────────────

    /**
     * POST /v1/integrations/eupago/crypto-key
     * Saves (or replaces) the Chave Criptográfica gerada no backoffice EuPago.
     */
    @Post('crypto-key')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gravar chave criptográfica dos webhooks EuPago' })
    @ApiCreatedResponse({ description: 'Chave criptográfica gravada com sucesso' })
    saveCryptoKey(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: SaveEupagoCryptoKeyDto,
    ) {
        return this.eupagoService.saveCryptoKey(establishment.id, dto.cryptoKey);
    }

    /**
     * DELETE /v1/integrations/eupago/crypto-key
     * Removes the stored Chave Criptográfica.
     */
    @Delete('crypto-key')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Remover chave criptográfica dos webhooks EuPago' })
    @ApiOkResponse({ description: 'Chave criptográfica removida com sucesso' })
    deleteCryptoKey(@CurrentEstablishment() establishment: Establishment) {
        return this.eupagoService.deleteCryptoKey(establishment.id);
    }

    // ─── Hosted Payment (Generic: CC, Google Pay, Apple Pay) ────────────────

    /**
     * POST /v1/integrations/eupago/hosted-payment
     */
    @Post('hosted-payment')
    @UseGuards(EupagoConfigGuard)
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gerar pagamento hospedado EuPago (Cartão de Crédito, Google Pay, Apple Pay)' })
    @ApiCreatedResponse({ description: 'Pagamento hospedado criado com sucesso' })
    async generateHostedPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: EupagoCreateHostedPaymentDto,
    ) {
        const typePrefixes = {
            CreditCard: 'cc',
            GooglePay: 'gp',
            ApplePay: 'ap'
        };

        return this.eupagoService.createHostedPayment(
            dto.type,
            establishment,
            `${typePrefixes[dto.type]}-${establishment.id}`,
            dto
        );
    }

    // ─── MB WAY Payment ───────────────────────────────────────────────────────

    /**
     * POST /v1/integrations/eupago/mbway/generate
     */
    @Post('mbway/generate')
    @UseGuards(EupagoConfigGuard)
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gerar pagamento por MB WAY' })
    @ApiCreatedResponse({ description: 'Pagamento MB WAY iniciado com sucesso' })
    async generateMbwayPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: EupagoCreateMbwayPaymentDto,
    ) {
        return this.eupagoService.createMbwayPayment(
            establishment,
            `mbw-${establishment.id}`,
            dto
        );
    }
}
