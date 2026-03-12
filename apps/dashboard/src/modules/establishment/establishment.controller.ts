import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/contracts/dashboard/dashboard.patterns';
import { EstablishmentService } from './establishment.service';
import { CreateEstablishmentDto } from '@weats/contracts/dashboard/dtos/establishment';
import { User, Establishment } from '@weats/types';

@Controller()
export class EstablishmentController {
    constructor(
        private readonly establishmentService: EstablishmentService,
    ) { }

    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_CREATE)
    createEstablishment(@Payload() payload: { createEstablishmentDto: CreateEstablishmentDto; user: User }) {
        return this.establishmentService.createEstablishment(payload.createEstablishmentDto, payload.user);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_BY_ID)
    getEstablishmentInfo(@Payload() payload: { id: string }) {
        return this.establishmentService.getEstablishmentInfo(payload.id);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SUBSCRIPTION)
    getSubscription(@Payload() payload: { id: string }) {
        return this.establishmentService.getSubscription(payload.id);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_PORTAL_SESSION)
    getPortalSession(@Payload() payload: { id: string }) {
        return this.establishmentService.getPortalSession(payload.id);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_SUBSCRIBE_TO_PLAN)
    subscribeToPlan(@Payload() payload: { planCycleId: string; establishment: Establishment }) {
        return this.establishmentService.subscribeToPlan(payload.planCycleId, payload.establishment);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_CANCEL_SUBSCRIPTION)
    cancelSubscription(@Payload() payload: { id: string; user: User }) {
        return this.establishmentService.cancelSubscription(payload.id, payload.user);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE)
    updateEstablishment(@Payload() payload: { id: string; updateEstablishmentDto: CreateEstablishmentDto; user: User }) {
        return this.establishmentService.updateEstablishment(payload.id, payload.updateEstablishmentDto, payload.user);
    }
}