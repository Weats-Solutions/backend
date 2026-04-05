import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { EstablishmentService } from './establishment.service';
import { CreateEstablishmentDto, UpdateEstablishmentLanguagesDto } from '@weats/contracts/dashboard/dtos/establishment';
import { User, Establishment } from '@weats/types';
import { UpdateEstablishmentBrandingDto } from '@weats/contracts/dashboard/dtos/establishment/update-establishment-branding.dto';
import { CreateScheduleDto } from '@weats/contracts/dashboard/dtos/schedule';
import { UpdateEstablishmentGeneralSettingsDto, UpdateEstablishmentBrandingSettingsDto } from '@weats/contracts';

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


    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SETTINGS_GENERAL)
    getEstablishmentGeneralSettings(@Payload() payload: { id: string }) {
        return this.establishmentService.getEstablishmentGeneralSettings(payload.id);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SETTINGS_BRANDING)
    getEstablishmentBrandingSettings(@Payload() payload: { id: string }) {
        return this.establishmentService.getEstablishmentBrandingSettings(payload.id);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SCHEDULE_BY_ID)
    getEstablishmentSchedule(@Payload() payload: { id: string }) {
        return this.establishmentService.getEstablishmentSchedule(payload.id);
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

    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SETTINGS_GENERAL)
    updateEstablishmentGeneralSettings(@Payload() payload: { establishment: Establishment; updateEstablishmentGeneralSettingsDto: UpdateEstablishmentGeneralSettingsDto }) {
        return this.establishmentService.updateEstablishmentGeneralSettings(payload.establishment, payload.updateEstablishmentGeneralSettingsDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SETTINGS_BRANDING)
    updateEstablishmentBrandingSettings(@Payload() payload: { establishment: Establishment; updateEstablishmentBrandingSettingsDto: UpdateEstablishmentBrandingSettingsDto }) {
        return this.establishmentService.updateEstablishmentBrandingSettings(payload.establishment, payload.updateEstablishmentBrandingSettingsDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SCHEDULE)
    updateSchedule(@Payload() payload: { establishment: Establishment; updateEstablishmentScheduleDto: CreateScheduleDto }) {
        return this.establishmentService.upsertEstablishmentSchedule(payload.establishment, payload.updateEstablishmentScheduleDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_LANGUAGES)
    updateLanguages(@Payload() payload: { establishment: Establishment; updateEstablishmentLanguagesDto: UpdateEstablishmentLanguagesDto }) {
        return this.establishmentService.updateLanguages(payload.establishment, payload.updateEstablishmentLanguagesDto);
    }

    /*
    @MessagePattern(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_BRANDING)
    updateBranding(@Payload() payload: { establishmentId: string; updateEstablishmentBrandingDto: UpdateEstablishmentBrandingDto }) {
        return this.establishmentService.updateBranding(payload.establishmentId, payload.updateEstablishmentBrandingDto);
    }
    */
}