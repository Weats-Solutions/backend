import { Controller, Post, Get, Delete, Patch, Body, UseGuards } from '@nestjs/common';
import { CurrentEstablishment, Roles, IfthenpayConfigGuard, ApiAuthenticated } from '@weats/common';
import { Establishment } from '@weats/types';
import { IfthenpayService } from '@weats/integrations/ifthenpay/ifthenpay.service';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import {
    SaveIfthenpayKeyDto,
    IfthenpayCreateMbwayPaymentDto,
    IfthenpayGetMbwayStatusDto,
    IfthenpayCreateMultibancoPaymentDto,
    IfthenpayCreatePayshopPaymentDto,
    IfthenpayCreateCreditCardPaymentDto,
    IfthenpayCreateCofidisPaymentDto,
    IfthenpayCreatePixPaymentDto,
    IfthenpayCreatePayByLinkPaymentDto,
} from '@weats/contracts';

@ApiTags('Integrations - Ifthenpay')
@Roles()
@Controller('integrations/ifthenpay')
export class IfthenpayIntegrationController {
    constructor(
        private readonly ifthenpayService: IfthenpayService
    ) { }

    @Get('key')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter estado e chave de autenticação da integração Ifthenpay' })
    @ApiOkResponse({ description: 'Estado da integração obtido com sucesso' })
    getStatus(@CurrentEstablishment() establishment: Establishment) {
        return this.ifthenpayService.getStatus(establishment.id);
    }

    @Post('key')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gravar chave de autenticação (authToken) da Ifthenpay' })
    @ApiCreatedResponse({ description: 'Chave gravada com sucesso' })
    saveKey(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: SaveIfthenpayKeyDto,
    ) {
        return this.ifthenpayService.saveKey(establishment.id, dto.authToken);
    }

    @Delete('key')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Remover chave da Ifthenpay' })
    @ApiOkResponse({ description: 'Chave removida com sucesso' })
    deleteKey(@CurrentEstablishment() establishment: Establishment) {
        return this.ifthenpayService.deleteKey(establishment.id);
    }

    @Patch('toggle')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Ativar ou desativar a integração Ifthenpay' })
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
        return this.ifthenpayService.toggle(establishment.id, enabled);
    }

    @Post('mbway/generate')
    @UseGuards(IfthenpayConfigGuard)
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gerar pagamento por MB WAY' })
    @ApiCreatedResponse({ description: 'Pagamento iniciado com sucesso' })
    async generateMbwayPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayCreateMbwayPaymentDto,
    ) {
        return this.ifthenpayService.createMbwayPayment(establishment.id, dto);
    }

    @Post('mbway/status')
    @UseGuards(IfthenpayConfigGuard)
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter estado de um pagamento MB WAY' })
    @ApiOkResponse({ description: 'Estado do pagamento obtido com sucesso' })
    async getMbwayStatus(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayGetMbwayStatusDto,
    ) {
        return this.ifthenpayService.getMbwayStatus(establishment.id, dto.transactionId);
    }

    @Post('multibanco/generate')
    @UseGuards(IfthenpayConfigGuard)
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gerar pagamento por Multibanco' })
    @ApiCreatedResponse({ description: 'Referência Multibanco gerada com sucesso' })
    async generateMultibancoPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayCreateMultibancoPaymentDto,
    ) {
        return this.ifthenpayService.createMultibancoPayment(establishment.id, dto);
    }

    @Post('payshop/generate')
    @UseGuards(IfthenpayConfigGuard)
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gerar pagamento por Payshop' })
    @ApiCreatedResponse({ description: 'Referência Payshop gerada com sucesso' })
    async generatePayshopPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayCreatePayshopPaymentDto,
    ) {
        return this.ifthenpayService.createPayshopPayment(establishment.id, dto);
    }

    @Post('credit-card/generate')
    @UseGuards(IfthenpayConfigGuard)
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gerar pagamento por Cartão de Crédito' })
    @ApiCreatedResponse({ description: 'Pagamento por cartão iniciado com sucesso' })
    async generateCreditCardPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayCreateCreditCardPaymentDto,
    ) {
        return this.ifthenpayService.createCreditCardPayment(establishment.id, dto);
    }

    @Post('cofidis/generate')
    @UseGuards(IfthenpayConfigGuard)
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gerar pagamento Cofidis Pay' })
    @ApiCreatedResponse({ description: 'Pagamento Cofidis iniciado com sucesso' })
    async generateCofidisPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayCreateCofidisPaymentDto,
    ) {
        return this.ifthenpayService.createCofidisPayment(establishment.id, dto);
    }

    @Post('pix/generate')
    @UseGuards(IfthenpayConfigGuard)
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gerar pagamento por Pix' })
    @ApiCreatedResponse({ description: 'Pagamento Pix gerado com sucesso' })
    async generatePixPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayCreatePixPaymentDto,
    ) {
        return this.ifthenpayService.createPixPayment(establishment.id, dto);
    }

    @Post('pay-by-link/generate')
    @UseGuards(IfthenpayConfigGuard)
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gerar pagamento Pay by Link' })
    @ApiCreatedResponse({ description: 'Link de pagamento gerado com sucesso' })
    async generatePayByLinkPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayCreatePayByLinkPaymentDto,
    ) {
        return this.ifthenpayService.createPayByLinkPayment(establishment.id, dto);
    }
}
