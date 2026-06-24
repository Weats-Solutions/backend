import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { IfthenpayService } from '@weats/integrations/ifthenpay/ifthenpay.service';
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

@Controller()
export class IfthenpayIntegrationController {
    constructor(
        private readonly ifthenpayService: IfthenpayService
    ) { }

    @MessagePattern(DASHBOARD_PATTERNS.IFTHENPAY_GET_STATUS)
    getStatus(@Payload() establishmentId: string) {
        return this.ifthenpayService.getStatus(establishmentId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.IFTHENPAY_SAVE_KEY)
    saveKey(
        @Payload() payload: { establishmentId: string, dto: SaveIfthenpayKeyDto },
    ) {
        return this.ifthenpayService.saveKey(payload.establishmentId, payload.dto.authToken);
    }

    @MessagePattern(DASHBOARD_PATTERNS.IFTHENPAY_DELETE_KEY)
    deleteKey(@Payload() establishmentId: string) {
        return this.ifthenpayService.deleteKey(establishmentId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.IFTHENPAY_TOGGLE)
    toggle(
        @Payload() payload: { establishmentId: string, enabled: boolean },
    ) {
        return this.ifthenpayService.toggle(payload.establishmentId, payload.enabled);
    }

    @MessagePattern(DASHBOARD_PATTERNS.IFTHENPAY_GENERATE_MBWAY_PAYMENT)
    async generateMbwayPayment(
        @Payload() payload: { establishmentId: string, dto: IfthenpayCreateMbwayPaymentDto },
    ) {
        return this.ifthenpayService.createMbwayPayment(payload.establishmentId, payload.dto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.IFTHENPAY_GET_MBWAY_STATUS)
    async getMbwayStatus(
        @Payload() payload: { establishmentId: string, dto: IfthenpayGetMbwayStatusDto },
    ) {
        return this.ifthenpayService.getMbwayStatus(payload.establishmentId, payload.dto.transactionId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.IFTHENPAY_GENERATE_MULTIBANCO_PAYMENT)
    async generateMultibancoPayment(
        @Payload() payload: { establishmentId: string, dto: IfthenpayCreateMultibancoPaymentDto },
    ) {
        return this.ifthenpayService.createMultibancoPayment(payload.establishmentId, payload.dto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.IFTHENPAY_GENERATE_PAYSHOP_PAYMENT)
    async generatePayshopPayment(
        @Payload() payload: { establishmentId: string, dto: IfthenpayCreatePayshopPaymentDto },
    ) {
        return this.ifthenpayService.createPayshopPayment(payload.establishmentId, payload.dto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.IFTHENPAY_GENERATE_CREDIT_CARD_PAYMENT)
    async generateCreditCardPayment(
        @Payload() payload: { establishmentId: string, dto: IfthenpayCreateCreditCardPaymentDto },
    ) {
        return this.ifthenpayService.createCreditCardPayment(payload.establishmentId, payload.dto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.IFTHENPAY_GENERATE_COFIDIS_PAYMENT)
    async generateCofidisPayment(
        @Payload() payload: { establishmentId: string, dto: IfthenpayCreateCofidisPaymentDto },
    ) {
        return this.ifthenpayService.createCofidisPayment(payload.establishmentId, payload.dto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.IFTHENPAY_GENERATE_PIX_PAYMENT)
    async generatePixPayment(
        @Payload() payload: { establishmentId: string, dto: IfthenpayCreatePixPaymentDto },
    ) {
        return this.ifthenpayService.createPixPayment(payload.establishmentId, payload.dto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.IFTHENPAY_GENERATE_PAY_BY_LINK_PAYMENT)
    async generatePayByLinkPayment(
        @Payload() payload: { establishmentId: string, dto: IfthenpayCreatePayByLinkPaymentDto },
    ) {
        return this.ifthenpayService.createPayByLinkPayment(payload.establishmentId, payload.dto);
    }
}
