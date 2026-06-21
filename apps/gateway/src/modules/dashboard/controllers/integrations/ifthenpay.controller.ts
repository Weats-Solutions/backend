import { Controller, Post, Get, Delete, Patch, Body, UseGuards, Inject } from '@nestjs/common';
import { CurrentEstablishment, Roles } from '@weats/common';
import { IfthenpayConfigGuard } from '@weats/common/guards/ifthenpay-config.guard';
import { Establishment } from '@weats/types';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_SERVICE } from '@weats/common/constants';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
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

@Roles()
@Controller('integrations/ifthenpay')
export class IfthenpayIntegrationController {
    constructor(
        @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
    ) { }

    @Get('key')
    getStatus(@CurrentEstablishment() establishment: Establishment) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IFTHENPAY_GET_STATUS, establishment.id);
    }

    @Post('key')
    saveKey(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: SaveIfthenpayKeyDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IFTHENPAY_SAVE_KEY, { establishmentId: establishment.id, dto });
    }

    @Delete('key')
    deleteKey(@CurrentEstablishment() establishment: Establishment) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IFTHENPAY_DELETE_KEY, establishment.id);
    }

    @Patch('toggle')
    toggle(
        @CurrentEstablishment() establishment: Establishment,
        @Body('enabled') enabled: boolean,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IFTHENPAY_TOGGLE, { establishmentId: establishment.id, enabled });
    }

    @Post('mbway/generate')
    @UseGuards(IfthenpayConfigGuard)
    generateMbwayPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayCreateMbwayPaymentDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IFTHENPAY_GENERATE_MBWAY_PAYMENT, {
            establishmentId: establishment.id,
            dto
        });
    }

    @Post('mbway/status')
    @UseGuards(IfthenpayConfigGuard)
    getMbwayStatus(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayGetMbwayStatusDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IFTHENPAY_GET_MBWAY_STATUS, {
            establishmentId: establishment.id,
            dto
        });
    }

    @Post('multibanco/generate')
    @UseGuards(IfthenpayConfigGuard)
    generateMultibancoPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayCreateMultibancoPaymentDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IFTHENPAY_GENERATE_MULTIBANCO_PAYMENT, {
            establishmentId: establishment.id,
            dto
        });
    }

    @Post('payshop/generate')
    @UseGuards(IfthenpayConfigGuard)
    generatePayshopPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayCreatePayshopPaymentDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IFTHENPAY_GENERATE_PAYSHOP_PAYMENT, {
            establishmentId: establishment.id,
            dto
        });
    }

    @Post('credit-card/generate')
    @UseGuards(IfthenpayConfigGuard)
    generateCreditCardPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayCreateCreditCardPaymentDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IFTHENPAY_GENERATE_CREDIT_CARD_PAYMENT, {
            establishmentId: establishment.id,
            dto
        });
    }

    @Post('cofidis/generate')
    @UseGuards(IfthenpayConfigGuard)
    generateCofidisPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayCreateCofidisPaymentDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IFTHENPAY_GENERATE_COFIDIS_PAYMENT, {
            establishmentId: establishment.id,
            dto
        });
    }

    @Post('pix/generate')
    @UseGuards(IfthenpayConfigGuard)
    generatePixPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayCreatePixPaymentDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IFTHENPAY_GENERATE_PIX_PAYMENT, {
            establishmentId: establishment.id,
            dto
        });
    }

    @Post('pay-by-link/generate')
    @UseGuards(IfthenpayConfigGuard)
    generatePayByLinkPayment(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: IfthenpayCreatePayByLinkPaymentDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IFTHENPAY_GENERATE_PAY_BY_LINK_PAYMENT, {
            establishmentId: establishment.id,
            dto
        });
    }
}
